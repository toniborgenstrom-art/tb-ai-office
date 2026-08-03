import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

const statuses = new Set(["offer", "active", "completed"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const payload: Record<string, unknown> = {};
  if ("status" in body) { if (typeof body.status !== "string" || !statuses.has(body.status)) return NextResponse.json({ error: "Virheellinen tila." }, { status: 400 }); payload.status = body.status; }
  if (typeof body.archived === "boolean") payload.archived_at = body.archived ? new Date().toISOString() : null;
  for (const [input, field] of [["name", "name"], ["location", "location"], ["projectType", "project_type"]] as const) {
    if (input in body) { if (typeof body[input] !== "string") return NextResponse.json({ error: "Virheellinen tieto." }, { status: 400 }); if (input === "name" && !body[input].trim()) return NextResponse.json({ error: "Kohteen nimi ei voi olla tyhjä." }, { status: 400 }); payload[field] = body[input].trim() || null; }
  }
  if ("projectDetails" in body) {
    if (typeof body.projectDetails !== "object" || body.projectDetails === null || Array.isArray(body.projectDetails)) return NextResponse.json({ error: "Virheelliset työmaatiedot." }, { status: 400 });
    payload.project_details = body.projectDetails;
  }
  if ("customerId" in body) {
    if (typeof body.customerId !== "string" || !body.customerId) return NextResponse.json({ error: "Valitse tilaaja." }, { status: 400 });
    const { data: customer } = await supabase.from("customers").select("id").eq("id", body.customerId).eq("company_id", companyId).maybeSingle();
    if (!customer) return NextResponse.json({ error: "Tilaajaa ei löytynyt." }, { status: 404 });
    payload.customer_id = body.customerId;
  }
  const { error: updateError } = await supabase.from("projects").update(payload).eq("id", id).eq("company_id", companyId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { id } = await params;
  const { count, error: countError } = await supabase.from("invoices").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("project_id", id);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 400 });
  if (count) return NextResponse.json({ error: "Kohdetta ei voi poistaa, koska siihen on kohdistettu laskuja. Arkistoi kohde sen sijaan." }, { status: 409 });
  const { error: deleteError } = await supabase.from("projects").delete().eq("id", id).eq("company_id", companyId);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
