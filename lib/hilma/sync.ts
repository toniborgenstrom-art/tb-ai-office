import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Env = (name: string) => string | undefined;
type HilmaRow = Record<string, unknown>;

const DEFAULT_SEARCH_URL = "https://api.hankintailmoitukset.fi/avp/notices/docs/search";
const keywords = ["LVI-valvonta", "KVV-työnjohtaja", "IV-työnjohtaja", "rakennuttajakonsultti", "talotekniikka", "valvoja", "kuntotutkimus", "sisäilma", "korjaussuunnittelu"];
const regions = ["Uusimaa", "Kanta-Häme", "Päijät-Häme", "Pirkanmaa"];

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";
const firstText = (row: HilmaRow, keys: string[]) => keys.map((key) => text(row[key])).find(Boolean) ?? "";

function noticeId(row: HilmaRow) {
  return firstText(row, ["id", "noticeId", "notice_id", "identifier", "ocid"]);
}

function flatten(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) return value.map(flatten).join(" ");
  if (typeof value === "object") return Object.values(value as Record<string, unknown>).map(flatten).join(" ");
  return "";
}

function details(row: HilmaRow) {
  const searchable = flatten(row);
  const title = firstText(row, ["title", "titleFi", "noticeTitle", "name", "object"]) || "Hilman hankintailmoitus";
  const region = regions.find((name) => searchable.toLocaleLowerCase("fi").includes(name.toLocaleLowerCase("fi"))) ?? firstText(row, ["region", "location", "municipality", "nuts"]);
  const address = firstText(row, ["address", "addressText", "municipality", "city", "location"]);
  const deadline = firstText(row, ["deadline", "deadlineDate", "submissionDeadline", "tenderDeadline"]);
  const published = firstText(row, ["publicationDate", "published", "publication_date"]);
  const url = firstText(row, ["url", "noticeUrl", "link"]);
  const matchingKeywords = keywords.filter((keyword) => searchable.toLocaleLowerCase("fi").includes(keyword.toLocaleLowerCase("fi")));
  const fit = Math.min(85, 35 + matchingKeywords.length * 12 + (regions.includes(region) ? 15 : 0));
  return { title, region, address, deadline, published, url, matchingKeywords, fit };
}

async function searchHilma(env: Env) {
  const apiKey = env("HILMA_AVP_API_KEY");
  if (!apiKey) throw new Error("Hilma API -avain puuttuu palvelinympäristöstä.");
  const response = await fetch(env("HILMA_SEARCH_API_URL") || DEFAULT_SEARCH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Ocp-Apim-Subscription-Key": apiKey },
    body: JSON.stringify({ search: keywords.join(" OR "), searchMode: "any", top: 50, count: true }),
    signal: AbortSignal.timeout(20_000),
  });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Hilma-haku epäonnistui (${response.status}): ${raw.slice(0, 220)}`);
  let parsed: unknown;
  try { parsed = JSON.parse(raw); } catch { throw new Error("Hilma-haku palautti virheellisen vastauksen."); }
  const object = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  const rows = Array.isArray(object.value) ? object.value : Array.isArray(object.notices) ? object.notices : Array.isArray(object.results) ? object.results : Array.isArray(object.items) ? object.items : Array.isArray(object.data) ? object.data : Array.isArray(parsed) ? parsed : [];
  return rows.filter((row): row is HilmaRow => !!row && typeof row === "object");
}

function adminClient(env: Env) {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SECRET_KEY");
  if (!url || !key) throw new Error("Supabase-palvelinavaimet puuttuvat.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function syncHilmaWithClient(database: SupabaseClient, companyId: string, env: Env = (name) => process.env[name]) {
  const rows = await searchHilma(env);
  const { data: existing, error: existingError } = await database.from("offers").select("id,content").eq("company_id", companyId).eq("source", "Hilma");
  if (existingError) throw new Error(existingError.message);
  const known = new Set((existing ?? []).flatMap((offer) => {
    try { const id = JSON.parse(offer.content ?? "{}").hilmaNoticeId; return typeof id === "string" ? [id] : []; } catch { return []; }
  }));

  let imported = 0;
  let relevant = 0;
  for (const row of rows) {
    const id = noticeId(row);
    if (!id || known.has(id)) continue;
    const info = details(row);
    // Azure Search has already matched the row to our LVI query. Some index
    // fields are nested and don't repeat the matching phrase verbatim.
    if (!info.matchingKeywords.length) info.matchingKeywords.push("Hilma-haku");
    relevant += 1;
    const content = JSON.stringify({ hilmaNoticeId: id, description: `${info.matchingKeywords.join(", ")} · Hilmasta haettu tarjouspyyntö.`, region: info.region, address: info.address, serviceType: info.matchingKeywords[0], sourceUrl: info.url, deadline: info.deadline, publishedAt: info.published, reasons: ["Hilman haku löysi palveluasi vastaavan avainsanan", info.region ? `Alue: ${info.region}` : "Alue tarkistettava ilmoituksesta"], estimate: "Arvioitava tarjousasiakirjoista", recommendation: "Selvitä lisää", hilmaIndexRow: row });
    const { error } = await database.from("offers").insert({ company_id: companyId, title: info.title, source: "Hilma", status: "new", fit_score: info.fit, content });
    if (error) throw new Error(error.message);
    imported += 1;
  }
  return { found: rows.length, relevant, imported };
}

export async function syncHilmaForCompany(companyId: string, env: Env = (name) => process.env[name]) {
  return syncHilmaWithClient(adminClient(env), companyId, env);
}

export async function syncHilmaForAllCompanies(env: Env) {
  const admin = adminClient(env);
  const { data: companies, error } = await admin.from("companies").select("id");
  if (error) throw new Error(error.message);
  const results = await Promise.all((companies ?? []).map((company) => syncHilmaForCompany(company.id, env)));
  return { workspaces: results.length, found: results.reduce((sum, item) => sum + item.found, 0), relevant: results.reduce((sum, item) => sum + item.relevant, 0), imported: results.reduce((sum, item) => sum + item.imported, 0) };
}
