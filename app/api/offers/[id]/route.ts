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
  const content = JSON.stringify({ ...previous, description: typeof input.description === "string" ? input.description.trim() : previous.description, region: typeof input.region === "string" ? input.region.trim() : previous.region, address: typeof input.address === "string" ? input.address.trim() : previous.address, serviceType: typeof input.serviceType === "string" ? input.serviceType.trim() : previous.serviceType, sourceUrl: typeof input.sourceUrl === "string" ? input.sourceUrl.trim() : previous.sourceUrl, deadline: typeof input.deadline === "string" ? input.deadline : previous.deadline });
  const payload: Record<string, string | number | null> = {
    title: typeof input.title === "string" && input.title.trim() ? input.title.trim() : undefined,
    source: typeof input.source === "string" ? input.source.trim() : offer.source,
    content
  };
  if (payload.title === undefined) delete payload.title;
  if (typeof input.status === "string" && ["new", "draft", "sent", "won", "lost", "declined"].includes(input.status)) payload.status = input.status;
  if (typeof input.offerNumber === "string") payload.offer_number = input.offerNumber.trim() || null;
  if (input.amount !== undefined) payload.amount = input.amount === "" || input.amount === null ? null : Number(input.amount);
  if (typeof input.expiresAt === "string") payload.expires_at = input.expiresAt || null;
  if ("projectId" in input) {
    if (typeof input.projectId !== "string" || !input.projectId) {
      payload.project_id = null;
      payload.customer_id = null;
    } else {
      const { data: project } = await supabase.from("projects").select("id,customer_id").eq("id", input.projectId).eq("company_id", companyId).maybeSingle();
      if (!project) return NextResponse.json({ error: "Kohdetta ei löydy työtilasta." }, { status: 404 });
      payload.project_id = project.id;
      payload.customer_id = project.customer_id;
    }
  }
  const { error: updateError } = await supabase.from("offers").update(payload).eq("id", id).eq("company_id", companyId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { id } = await params;
  const { error: deleteError } = await supabase.from("offers").delete().eq("id", id).eq("company_id", companyId);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
