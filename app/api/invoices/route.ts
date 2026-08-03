import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

async function resolveProject(
  supabase: Awaited<ReturnType<typeof getCurrentWorkspace>>["supabase"],
  companyId: string,
  targetId: string,
) {
  if (!targetId.startsWith("customer:")) {
    const { data } = await supabase.from("projects").select("id,customer_id").eq("id", targetId).eq("company_id", companyId).maybeSingle();
    return data;
  }
  const customerId = targetId.slice("customer:".length);
  const { data: customer } = await supabase.from("customers").select("id,name").eq("id", customerId).eq("company_id", companyId).is("archived_at", null).maybeSingle();
  if (!customer) return null;
  const { data: existing } = await supabase.from("projects").select("id,customer_id").eq("company_id", companyId).eq("customer_id", customer.id).is("archived_at", null).limit(1).maybeSingle();
  if (existing) return existing;
  const { data: created } = await supabase.from("projects").insert({ company_id: companyId, customer_id: customer.id, name: customer.name, status: "active" }).select("id,customer_id").single();
  return created;
}

export async function POST(request: Request) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });

  const { projectId, invoiceNumber, amount, dueDate } = await request.json();
  if (typeof projectId !== "string" || typeof invoiceNumber !== "string" || !invoiceNumber.trim() || !Number.isFinite(Number(amount))) {
    return NextResponse.json({ error: "Täytä kohde, laskunumero ja summa." }, { status: 400 });
  }
  const project = await resolveProject(supabase, companyId, projectId);
  if (!project) return NextResponse.json({ error: "Kohdetta ei löytynyt." }, { status: 404 });

  const { error: insertError } = await supabase.from("invoices").insert({
    company_id: companyId,
    project_id: project.id,
    customer_id: project.customer_id,
    invoice_number: invoiceNumber.trim(),
    amount: Number(amount),
    due_date: dueDate || null,
  });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
