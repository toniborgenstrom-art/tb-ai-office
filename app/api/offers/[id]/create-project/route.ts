import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { id } = await params;
  const { data: offer } = await supabase.from("offers").select("id,title,project_id,content").eq("id", id).eq("company_id", companyId).maybeSingle();
  if (!offer) return NextResponse.json({ error: "Tarjousta ei löydy." }, { status: 404 });
  if (offer.project_id) return NextResponse.json({ error: "Tarjous on jo kohdistettu kohteelle." }, { status: 409 });

  let details: Record<string, unknown> = {};
  try { details = JSON.parse(offer.content ?? "{}"); } catch { /* Empty details are valid. */ }
  const toolOffer = typeof details.toolOffer === "object" && details.toolOffer ? details.toolOffer as Record<string, unknown> : {};
  const name = (typeof toolOffer.project === "string" && toolOffer.project.trim()) || offer.title;
  const location = (typeof toolOffer.address === "string" && toolOffer.address.trim()) || (typeof details.region === "string" && details.region.trim()) || null;
  const projectType = typeof toolOffer.projectType === "string" && toolOffer.projectType.trim() ? toolOffer.projectType.trim() : null;

  const { data: customer, error: customerError } = await supabase.from("customers").insert({ company_id: companyId, name }).select("id").single();
  if (customerError || !customer) return NextResponse.json({ error: customerError?.message ?? "Asiakasta ei voitu luoda." }, { status: 400 });
  const { data: project, error: projectError } = await supabase.from("projects").insert({ company_id: companyId, customer_id: customer.id, name, location, project_type: projectType, status: "active" }).select("id").single();
  if (projectError || !project) {
    await supabase.from("customers").delete().eq("id", customer.id);
    return NextResponse.json({ error: projectError?.message ?? "Kohdetta ei voitu luoda." }, { status: 400 });
  }
  const { error: updateError } = await supabase.from("offers").update({ customer_id: customer.id, project_id: project.id, status: "won" }).eq("id", id).eq("company_id", companyId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  return NextResponse.json({ ok: true, projectId: project.id });
}
