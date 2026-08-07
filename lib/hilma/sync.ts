import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { defaultOfferWatchSettings, toOfferWatchSettings, type OfferWatchSettings } from "@/lib/offer-watch-settings";

type Env = (name: string) => string | undefined;
type HilmaRow = Record<string, unknown>;

const DEFAULT_SEARCH_URL = "https://api.hankintailmoitukset.fi/avp/notices/docs/search";
const DEFAULT_NOTICE_URL = "https://api.hankintailmoitukset.fi/avp-notice/api/avp/notices/";
const searchKeywords = defaultOfferWatchSettings.serviceKeywords;

const text = (value: unknown) => typeof value === "string" || typeof value === "number" ? String(value).trim() : "";
const normal = (value: string) => value.toLocaleLowerCase("fi").replace(/[^a-z0-9]/g, "");
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

function deepText(value: unknown, keys: string[]): string {
  const wanted = new Set(keys.map(normal));
  const queue: unknown[] = [value];
  const seen = new Set<object>();
  while (queue.length) {
    const current = queue.shift();
    if (!current || typeof current !== "object") continue;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const [key, child] of Object.entries(current as HilmaRow)) {
      if (wanted.has(normal(key))) {
        // Hilma stores several Finnish-language fields as nested objects
        // (for example { fi: "..." }). Flatten the value rather than only
        // accepting an immediate string, so title, buyer and deadline survive.
        const candidate = flatten(child).trim();
        if (candidate) return candidate;
      }
      if (child && typeof child === "object") queue.push(child);
    }
  }
  return "";
}

function details(row: HilmaRow, settings: OfferWatchSettings) {
  const searchable = flatten(row);
  const title = firstText(row, ["title", "titleFi", "noticeTitle", "name", "object"]) || deepText(row, ["procurementTitle", "procedureTitle", "title", "titleFi", "name"]) || "Hilman hankintailmoitus";
  const description = firstText(row, ["shortDescription", "description", "summary"]) || deepText(row, ["shortDescription", "procurementDescription", "description", "objectDescription"]);
  const buyer = firstText(row, ["buyer", "buyerName", "officialName", "organisationName"]) || deepText(row, ["officialName", "buyerName", "contractingAuthorityName", "organisationName"]);
  const matchedRegion = settings.regions.find((name) => searchable.toLocaleLowerCase("fi").includes(name.toLocaleLowerCase("fi")));
  const region = matchedRegion ?? (firstText(row, ["region", "location", "municipality", "nuts"]) || deepText(row, ["region", "municipality", "city", "placePerformance", "nutsCodes"]));
  const address = firstText(row, ["address", "addressText", "municipality", "city", "location"]) || deepText(row, ["address", "addressText", "municipality", "city", "place"]);
  const deadline = firstText(row, ["deadline", "deadlineDate", "submissionDeadline", "tenderDeadline"]) || deepText(row, ["tendersOrRequestsToParticipateDueDateTime", "submissionDeadline", "tenderDeadline", "deadline"]);
  const published = firstText(row, ["publicationDate", "published", "publication_date"]) || deepText(row, ["publicationDate", "publishedInHilma", "published"]);
  const url = firstText(row, ["url", "noticeUrl", "link", "publicUrl", "procurementDocumentsUrl"]) || deepText(row, ["noticeUrl", "publicUrl", "procurementDocumentsUrl", "url", "link"]);
  const matchingKeywords = settings.serviceKeywords.filter((keyword) => searchable.toLocaleLowerCase("fi").includes(keyword.toLocaleLowerCase("fi")));
  const fit = Math.min(100, 30 + matchingKeywords.length * 14 + (matchedRegion ? 15 : 0) + (description ? 5 : 0));
  return { title, description, buyer, region, address, deadline, published, url, matchingKeywords, matchedRegion, fit };
}

function rowsFromResponse(parsed: unknown) {
  const object = parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : {};
  const rows = Array.isArray(object.value) ? object.value : Array.isArray(object.notices) ? object.notices : Array.isArray(object.results) ? object.results : Array.isArray(object.items) ? object.items : Array.isArray(object.data) ? object.data : Array.isArray(parsed) ? parsed : [];
  return rows.filter((row): row is HilmaRow => !!row && typeof row === "object");
}

async function hilmaJson(url: string, env: Env, options: RequestInit) {
  const apiKey = env("HILMA_AVP_API_KEY");
  if (!apiKey) throw new Error("Hilma API -avain puuttuu palvelinympäristöstä.");
  const response = await fetch(url, { ...options, headers: { "Ocp-Apim-Subscription-Key": apiKey, ...(options.headers ?? {}) }, signal: AbortSignal.timeout(15_000) });
  const raw = await response.text();
  if (!response.ok) throw new Error(`Hilma-haku epäonnistui (${response.status}): ${raw.slice(0, 220)}`);
  try { return JSON.parse(raw) as unknown; } catch { throw new Error("Hilma-haku palautti virheellisen vastauksen."); }
}

async function searchHilma(env: Env) {
  const parsed = await hilmaJson(env("HILMA_SEARCH_API_URL") || DEFAULT_SEARCH_URL, env, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ search: searchKeywords.join(" OR "), searchMode: "any", select: "id", orderby: "datePublished desc", top: 25, count: true }),
  });
  return rowsFromResponse(parsed);
}

async function readNotice(id: string, env: Env) {
  const endpoint = `${env("HILMA_NOTICE_API_URL") || DEFAULT_NOTICE_URL}${encodeURIComponent(id)}`;
  const parsed = await hilmaJson(endpoint, env, { method: "GET" });
  return parsed && typeof parsed === "object" ? parsed as HilmaRow : {};
}

async function readNoticeBodies(ids: string[], env: Env) {
  const result = new Map<string, HilmaRow>();
  for (let index = 0; index < ids.length; index += 3) {
    const batch = ids.slice(index, index + 3);
    await Promise.all(batch.map(async (id) => {
      try { result.set(id, await readNotice(id, env)); } catch { /* keep index data if an individual notice is temporarily unavailable */ }
    }));
  }
  return result;
}

function hasNoticeBody(value: unknown): value is HilmaRow {
  return Boolean(value && typeof value === "object" && Object.keys(value as HilmaRow).length > 0);
}

function isFinnishAndOpen(notice: HilmaRow, deadline: string) {
  if (text(notice.language).toUpperCase() !== "FI") return false;
  const date = deadline.match(/\d{4}-\d{2}-\d{2}/)?.[0];
  if (!date) return false;
  const deadlineAt = new Date(`${date}T23:59:59.999Z`);
  return Number.isFinite(deadlineAt.getTime()) && deadlineAt >= new Date();
}

function isFullyEnriched(content: Record<string, unknown>) {
  // Earlier versions marked a row as fetched even if the notice-body request
  // failed. Such a row must be retried, otherwise it stays a generic card.
  return Boolean(content.hilmaDetailFetchedAt && hasNoticeBody(content.hilmaNotice));
}

function adminClient(env: Env) {
  const url = env("NEXT_PUBLIC_SUPABASE_URL");
  const key = env("SUPABASE_SECRET_KEY");
  if (!url || !key) throw new Error("Supabase-palvelinavaimet puuttuvat.");
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function loadSettings(database: SupabaseClient, companyId: string) {
  const { data, error } = await database.from("offer_watch_settings").select("*").eq("company_id", companyId).maybeSingle();
  // Keep the existing watch working before the migration has been applied.
  if (error) return defaultOfferWatchSettings;
  return toOfferWatchSettings(data);
}

async function createOfferNotification(database: SupabaseClient, companyId: string, settings: OfferWatchSettings, info: ReturnType<typeof details>, env: Env) {
  const body = [info.buyer, info.region, info.deadline ? `Määräaika ${info.deadline}` : ""].filter(Boolean).join(" · ");
  await database.from("notifications").insert({ company_id: companyId, title: `Uusi sopiva tarjouspyyntö: ${info.title}`, body, channel: "in_app" });
  if (!settings.emailNotificationsEnabled || !settings.notificationEmail) return;
  const apiKey = env("RESEND_API_KEY");
  const from = env("OFFER_WATCH_EMAIL_FROM");
  if (!apiKey || !from) return;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [settings.notificationEmail], subject: `TB AI Office: ${info.title}`, text: `${body}\n\nAvaa TB AI Office ja tarkista tarjouspyyntö.` }),
      signal: AbortSignal.timeout(10_000),
    });
  } catch { /* The in-app notification remains available if e-mail is temporarily unavailable. */ }
}

export async function syncHilmaWithClient(database: SupabaseClient, companyId: string, env: Env = (name) => process.env[name]) {
  const settings = await loadSettings(database, companyId);
  const rows = await searchHilma(env);
  const { data: existing, error: existingError } = await database.from("offers").select("id,title,content").eq("company_id", companyId).eq("source", "Hilma");
  if (existingError) throw new Error(existingError.message);
  const known = new Map<string, { id: string; detailed: boolean }>();
  for (const offer of existing ?? []) {
    try {
      const content = JSON.parse(offer.content ?? "{}");
      if (typeof content.hilmaNoticeId === "string") {
        const isGenericLegacyCard = offer.title === "Hilman hankintailmoitus";
        known.set(content.hilmaNoticeId, { id: offer.id, detailed: isFullyEnriched(content) && !isGenericLegacyCard });
      }
    } catch { /* ignore legacy manual content */ }
  }

  const candidates = rows.map((row) => noticeId(row)).filter((id): id is string => Boolean(id) && !known.get(id)?.detailed);
  const bodies = await readNoticeBodies(candidates, env);
  let imported = 0;
  let updated = 0;
  let relevant = 0;
  for (const row of rows) {
    const id = noticeId(row);
    if (!id) continue;
    const current = known.get(id);
    if (current?.detailed) { relevant += 1; continue; }
    const notice = bodies.get(id);
    const info = details({ ...row, ...(notice ?? {}) }, settings);
    // A search-index hit is not automatically relevant. Do not create a
    // generic card for old or unrelated notices; only persisted notices must
    // contain an actual service keyword from their full notice body.
    if (!info.matchingKeywords.length) continue;
    if (!hasNoticeBody(notice)) continue;
    if (!isFinnishAndOpen(notice, info.deadline)) continue;
    if (!info.matchedRegion || info.fit < settings.minFitScore) continue;
    relevant += 1;
    const description = info.description || `${info.matchingKeywords.join(", ")} · Hilmasta haettu tarjouspyyntö.`;
    const reasons = [
      "Hankinnan koko sisältö ladattu Hilman rajapinnasta",
      info.buyer ? `Hankintayksikkö: ${info.buyer}` : "Hankintayksikkö tarkistettava ilmoituksesta",
      info.region ? `Alue: ${info.region}` : "Alue tarkistettava ilmoituksesta",
      info.deadline ? `Määräaika: ${info.deadline}` : "Määräaika tarkistettava ilmoituksesta",
    ];
    const content = JSON.stringify({ hilmaNoticeId: id, ...(hasNoticeBody(notice) ? { hilmaDetailFetchedAt: new Date().toISOString() } : {}), description, buyer: info.buyer, region: info.region, address: info.address, serviceType: info.matchingKeywords[0], sourceUrl: info.url, deadline: info.deadline, publishedAt: info.published, reasons, estimate: "Arvioitava tarjousasiakirjoista", recommendation: "Selvitä lisää", hilmaIndexRow: row, hilmaNotice: notice ?? null });
    const values = { title: info.title, source: "Hilma", status: "new", fit_score: info.fit, content };
    const { error } = current
      ? await database.from("offers").update(values).eq("id", current.id).eq("company_id", companyId)
      : await database.from("offers").insert({ company_id: companyId, ...values });
    if (error) throw new Error(error.message);
    if (current) updated += 1;
    else {
      imported += 1;
      await createOfferNotification(database, companyId, settings, info, env);
    }
  }
  return { found: rows.length, relevant, imported, updated };
}

export async function syncHilmaForCompany(companyId: string, env: Env = (name) => process.env[name]) {
  return syncHilmaWithClient(adminClient(env), companyId, env);
}

export async function syncHilmaForAllCompanies(env: Env) {
  const admin = adminClient(env);
  const { data: companies, error } = await admin.from("companies").select("id");
  if (error) throw new Error(error.message);
  const results = await Promise.all((companies ?? []).map((company) => syncHilmaForCompany(company.id, env)));
  return { workspaces: results.length, found: results.reduce((sum, item) => sum + item.found, 0), relevant: results.reduce((sum, item) => sum + item.relevant, 0), imported: results.reduce((sum, item) => sum + item.imported, 0), updated: results.reduce((sum, item) => sum + item.updated, 0) };
}
