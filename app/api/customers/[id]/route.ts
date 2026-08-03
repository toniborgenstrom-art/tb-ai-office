import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { id } = await params;
  const body = await request.json();
  const payload: Record<string, string | null> = {};
  if (typeof body.archived === "boolean") payload.archived_at = body.archived ? new Date().toISOString() : null;
  for (const [input, field] of [["name", "name"], ["contactName", "contact_name"], ["email", "email"], ["phone", "phone"], ["customerType", "customer_type"]] as const) {
    if (input in body) {
      if (typeof body[input] !== "string") return NextResponse.json({ error: "Virheellinen tieto." }, { status: 400 });
      if (input === "name" && !body[input].trim()) return NextResponse.json({ error: "Nimi ei voi olla tyhjä." }, { status: 400 });
      payload[field] = body[input].trim() || null;
    }
  }
  const { error: updateError } = await supabase.from("customers").update(payload).eq("id", id).eq("company_id", companyId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { id } = await params;
  const { count, error: countError } = await supabase.from("projects").select("id", { count: "exact", head: true }).eq("company_id", companyId).eq("customer_id", id);
  if (countError) return NextResponse.json({ error: countError.message }, { status: 400 });
  if (count) return NextResponse.json({ error: "Tilaajaa ei voi poistaa, koska siihen liittyy kohteita. Arkistoi se sen sijaan." }, { status: 409 });
  const { error: deleteError } = await supabase.from("customers").delete().eq("id", id).eq("company_id", companyId);
  if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
