import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type ToolOffer = {
  id?: unknown;
  number?: unknown;
  customer?: unknown;
  company?: unknown;
  email?: unknown;
  phone?: unknown;
  project?: unknown;
  address?: unknown;
  projectType?: unknown;
  status?: unknown;
  deadline?: unknown;
  created?: unknown;
  updatedAt?: unknown;
  fixedPrice?: unknown;
  priceMode?: unknown;
  lines?: unknown;
  [key: string]: unknown;
};

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

function netAmount(offer: ToolOffer) {
  if (offer.priceMode === "fixed" && Number.isFinite(Number(offer.fixedPrice))) return Number(offer.fixedPrice);
  if (!Array.isArray(offer.lines)) return 0;
  return offer.lines.reduce((sum, line) => {
    if (!line || typeof line !== "object") return sum;
    const item = line as { qty?: unknown; price?: unknown };
    return sum + Number(item.qty || 0) * Number(item.price || 0);
  }, 0);
}

function status(value: unknown) {
  const source = text(value).toLowerCase();
  if (source.includes("hyv") || source.includes("voit")) return "won";
  if (source.includes("lähet")) return "sent";
  if (source.includes("hyl") || source.includes("peruut")) return "lost";
  return "draft";
}

export async function POST(request: Request) {
  const secret = process.env.TB_OFFER_SYNC_SECRET;
  if (!secret || request.headers.get("x-tb-offer-sync-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Tarjoussynkronointi ei ole viel\u00e4 palvelimella m\u00e4\u00e4ritetty." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { email?: unknown; state?: { offers?: unknown } } | null;
  const email = text(body?.email).toLowerCase();
  const toolOffers = Array.isArray(body?.state?.offers) ? body!.state!.offers.filter((item): item is ToolOffer => !!item && typeof item === "object") : [];
  if (!email) return NextResponse.json({ error: "K\u00e4ytt\u00e4j\u00e4n s\u00e4hk\u00f6posti puuttuu." }, { status: 400 });

  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  const authUser = authData.users.find((user) => user.email?.toLowerCase() === email);
  if (!authUser) return NextResponse.json({ error: "AI Office -k\u00e4ytt\u00e4j\u00e4\u00e4 ei l\u00f6ydy samalla s\u00e4hk\u00f6postilla." }, { status: 404 });

  const { data: profile, error: profileError } = await admin.from("users").select("company_id").eq("id", authUser.id).maybeSingle();
  if (profileError || !profile?.company_id) return NextResponse.json({ error: profileError?.message || "Ty\u00f6tilaa ei l\u00f6ydy." }, { status: 404 });

  const { data: existing, error: existingError } = await admin.from("offers").select("id, content").eq("company_id", profile.company_id).eq("source", "Tarjousty\u00f6kalu");
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });
  const existingByExternalId = new Map<string, string>();
  (existing || []).forEach((row) => {
    try {
      const externalId = JSON.parse(row.content || "{}").tarjoustyokaluId;
      if (typeof externalId === "string") existingByExternalId.set(externalId, row.id);
    } catch { /* Older manual offers have plain-text content. */ }
  });

  let saved = 0;
  for (const toolOffer of toolOffers) {
    const externalId = text(toolOffer.id);
    if (!externalId) continue;
    const projectName = text(toolOffer.project);
    const customerName = text(toolOffer.customer) || text(toolOffer.company);
    const title = projectName || customerName || text(toolOffer.number) || "Tarjous Tarjousty\u00f6kalusta";
    const rawStatus = text(toolOffer.status);
    const content = JSON.stringify({
      tarjoustyokaluId: externalId,
      description: `Tarjousty\u00f6kalussa laadittu tarjous${projectName ? ` kohteeseen ${projectName}` : ""}.`,
      sourceUrl: null,
      externalUpdatedAt: text(toolOffer.updatedAt) || text(toolOffer.created),
      toolOffer
    });
    const payload = {
      company_id: profile.company_id,
      title,
      source: "Tarjousty\u00f6kalu",
      status: status(rawStatus),
      content,
      offer_number: text(toolOffer.number) || null,
      amount: netAmount(toolOffer),
      expires_at: text(toolOffer.deadline) || null
    };
    const existingId = existingByExternalId.get(externalId);
    const result = existingId
      ? await admin.from("offers").update(payload).eq("id", existingId).eq("company_id", profile.company_id)
      : await admin.from("offers").insert(payload);
    if (result.error) return NextResponse.json({ error: result.error.message, saved }, { status: 400 });
    saved += 1;
  }

  return NextResponse.json({ ok: true, saved });
}
