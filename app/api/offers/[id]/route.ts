import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { id } = await params;
  const { data: offer } = await supabase.from("offers").select("content,source").eq("id", id).eq("company_id", companyId).maybeSingle();
  if (!offer) return NextResponse.json({ error: "Tarjouspyyntöä ei löytynyt." }, { status: 404 });
  const input = await request.json();
  let previous: Record<string, unknown> = {};
  try { previous = JSON.parse(offer.content ?? "{}"); } catch { previous = { description: offer.content ?? "" }; }
  const content = JSON.stringify({ ...previous, description: typeof input.description === "string" ? input.description.trim() : previous.description, region: typeof input.region === "string" ? input.region.trim() : previous.region, sourceUrl: typeof input.sourceUrl === "string" ? input.sourceUrl.trim() : previous.sourceUrl, deadline: typeof input.deadline === "string" ? input.deadline : previous.deadline });
  const payload: Record<string, string | number | null> = { source: typeof input.source === "string" ? input.source.trim() : offer.source, content };
  if (typeof input.status === "string" && ["new", "draft", "sent", "won", "lost", "declined"].includes(input.status)) payload.status = input.status;
  if (typeof input.offerNumber === "string") payload.offer_number = input.offerNumber.trim() || null;
  if (input.amount !== undefined) payload.amount = input.amount === "" || input.amount === null ? null : Number(input.amount);
  if (typeof input.expiresAt === "string") payload.expires_at = input.expiresAt || null;
  const { error: updateError } = await supabase.from("offers").update(payload).eq("id", id).eq("company_id", companyId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
