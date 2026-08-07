import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

const types = new Set(["general", "plumbing", "drainage", "ventilation", "heating", "handover", "warranty", "other"]);
const defaults: Record<string, string> = { general: "Yleinen katselmus", plumbing: "Vesi- ja vesijohtotöiden katselmus", drainage: "Viemäritöiden katselmus", ventilation: "Ilmanvaihdon katselmus", heating: "Lämmitysjärjestelmän katselmus", handover: "Luovutuskatselmus", warranty: "Takuukatselmus", other: "Katselmus" };

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { id: projectId } = await params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const inspectionDate = typeof body?.inspectionDate === "string" ? body.inspectionDate : "";
  const inspectionType = typeof body?.inspectionType === "string" ? body.inspectionType : "general";
  const title = typeof body?.title === "string" ? body.title.trim() : "";
  const notes = typeof body?.notes === "string" ? body.notes.trim() : "";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(inspectionDate) || !types.has(inspectionType)) return NextResponse.json({ error: "Täytä katselmuksen päivämäärä ja tyyppi." }, { status: 400 });
  const { data: project } = await supabase.from("projects").select("id").eq("id", projectId).eq("company_id", companyId).maybeSingle();
  if (!project) return NextResponse.json({ error: "Kohdetta ei löytynyt." }, { status: 404 });
  const result = await supabase.from("project_inspections").insert({ company_id: companyId, project_id: projectId, inspection_date: inspectionDate, inspection_type: inspectionType, title: title || defaults[inspectionType], notes: notes || null });
  if (result.error) return NextResponse.json({ error: result.error.message.includes("project_inspections") ? "Katselmusrekisteri puuttuu. Suorita ensin uusi Supabase-migraatio." : result.error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
