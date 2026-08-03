import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

const allowed = new Set(["draft", "sent", "paid", "overdue", "cancelled"]);
type WorkspaceClient = Awaited<ReturnType<typeof getCurrentWorkspace>>["supabase"];

async function findOrCreateProject(supabase: WorkspaceClient, companyId: string, projectId?: string, projectName?: string) {
  if (projectId && !projectId.startsWith("customer:")) {
    const { data } = await supabase.from("projects").select("id,customer_id").eq("id", projectId).eq("company_id", companyId).maybeSingle();
    return data;
  }

  const customerId = projectId?.startsWith("customer:") ? projectId.slice("customer:".length) : undefined;
  const cleanName = projectName?.trim();
  if (!customerId && !cleanName) return null;

  let customer: { id: string; name: string } | null = null;
  if (customerId) {
    const { data } = await supabase.from("customers").select("id,name").eq("id", customerId).eq("company_id", companyId).maybeSingle();
    customer = data;
  } else if (cleanName) {
    const { data: existingProject } = await supabase.from("projects").select("id,customer_id").eq("company_id", companyId).ilike("name", cleanName).maybeSingle();
    if (existingProject) return existingProject;
    const { data } = await supabase.from("customers").select("id,name").eq("company_id", companyId).ilike("name", cleanName).maybeSingle();
    customer = data;
  }

  if (!customer && cleanName) {
    const { data, error } = await supabase.from("customers").insert({ company_id: companyId, name: cleanName }).select("id,name").single();
    if (error) return null;
    customer = data;
  }
  if (!customer) return null;

  const { data: existingProject } = await supabase.from("projects").select("id,customer_id").eq("company_id", companyId).eq("customer_id", customer.id).limit(1).maybeSingle();
  if (existingProject) return existingProject;

  const { data: created } = await supabase.from("projects").insert({ company_id: companyId, customer_id: customer.id, name: customer.name, status: "active" }).select("id,customer_id").single();
  return created;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { id } = await params;
  const { status, projectId, projectName } = await request.json();
  const payload: Record<string, string | null> = {};

  if (status !== undefined) {
    if (!allowed.has(status)) return NextResponse.json({ error: "Virheellinen laskun tila." }, { status: 400 });
    const now = new Date().toISOString();
    payload.status = status;
    if (status === "sent") payload.sent_at = now;
    if (status === "paid") payload.paid_at = now;
  }
  if (projectId !== undefined || projectName !== undefined) {
    const project = await findOrCreateProject(supabase, companyId, projectId, projectName);
    if (!project) return NextResponse.json({ error: "Kohdetta ei voitu hakea tai luoda." }, { status: 400 });
    payload.project_id = project.id;
    payload.customer_id = project.customer_id;
  }

  // RLS still protects the row. Do not reject invoices created before the
  // workspace relation was normalised merely because their old company_id
  // differs from the current profile's company.
  const { data: updated, error: updateError } = await supabase
    .from("invoices")
    .update(payload)
    .eq("id", id)
    .select("id")
    .maybeSingle();
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  if (!updated) return NextResponse.json({ error: "Laskuriviä ei voitu päivittää tässä työtilassa." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
