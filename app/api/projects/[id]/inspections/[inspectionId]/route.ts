import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

const statuses = new Set(["planned", "completed", "cancelled"]);

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string; inspectionId: string }> }) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { id: projectId, inspectionId } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (typeof body?.status === "string") { if (!statuses.has(body.status)) return NextResponse.json({ error: "Virheellinen tila." }, { status: 400 }); payload.status = body.status; }
  if (typeof body?.inspectionDate === "string") payload.inspection_date = body.inspectionDate;
  if (typeof body?.title === "string") payload.title = body.title.trim();
  if (typeof body?.notes === "string") payload.notes = body.notes.trim() || null;
  const result = await supabase.from("project_inspections").update(payload).eq("id", inspectionId).eq("project_id", projectId).eq("company_id", companyId);
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string; inspectionId: string }> }) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { id: projectId, inspectionId } = await params;
  const result = await supabase.from("project_inspections").delete().eq("id", inspectionId).eq("project_id", projectId).eq("company_id", companyId);
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
