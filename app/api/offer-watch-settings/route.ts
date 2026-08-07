import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { defaultOfferWatchSettings, toOfferWatchSettings } from "@/lib/offer-watch-settings";
import { NextResponse } from "next/server";

const validEmail = (value: string) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
const cleanList = (value: unknown) => Array.isArray(value)
  ? value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 20)
  : [];

export async function GET() {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { data, error: queryError } = await supabase.from("offer_watch_settings").select("*").eq("company_id", companyId).maybeSingle();
  if (queryError) return NextResponse.json({ settings: defaultOfferWatchSettings, schemaPending: true });
  return NextResponse.json({ settings: toOfferWatchSettings(data) });
}

export async function PUT(request: Request) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  const serviceKeywords = cleanList(input?.serviceKeywords);
  const regions = cleanList(input?.regions);
  const minFitScore = Number(input?.minFitScore);
  const notificationEmail = typeof input?.notificationEmail === "string" ? input.notificationEmail.trim().toLowerCase() : "";
  if (!serviceKeywords.length || !regions.length) return NextResponse.json({ error: "Valitse vähintään yksi palvelu ja toiminta-alue." }, { status: 400 });
  if (!Number.isFinite(minFitScore) || minFitScore < 0 || minFitScore > 100) return NextResponse.json({ error: "Vähimmäispisteiden tulee olla 0–100." }, { status: 400 });
  if (!validEmail(notificationEmail)) return NextResponse.json({ error: "Anna kelvollinen sähköpostiosoite." }, { status: 400 });
  const { error: saveError } = await supabase.from("offer_watch_settings").upsert({
    company_id: companyId, service_keywords: serviceKeywords, regions,
    min_fit_score: Math.round(minFitScore), notification_email: notificationEmail || null,
    email_notifications_enabled: input?.emailNotificationsEnabled === true && Boolean(notificationEmail), updated_at: new Date().toISOString(),
  }, { onConflict: "company_id" });
  if (saveError) return NextResponse.json({ error: "Asetusten tallennus edellyttää ensin Supabase-muutoksen suorittamista." }, { status: 400 });
  return NextResponse.json({ ok: true });
}
