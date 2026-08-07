import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { id } = await params;
  const input = await request.json().catch(() => ({})) as { projectId?: unknown };
  const projectId = typeof input.projectId === "string" ? input.projectId : "";
  if (projectId) {
    const { data: project } = await supabase.from("projects").select("id").eq("id", projectId).eq("company_id", companyId).maybeSingle();
    if (!project) return NextResponse.json({ error: "Kohdetta ei loydy tyotilasta." }, { status: 404 });
  }
  const { error: updateError } = await supabase.from("documents").update({ project_id: projectId || null }).eq("id", id).eq("company_id", companyId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
