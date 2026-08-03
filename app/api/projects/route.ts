import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { name, location, projectType, customerId } = await request.json();
  if (typeof name !== "string" || !name.trim()) return NextResponse.json({ error: "Työmaan nimi puuttuu." }, { status: 400 });
  if (typeof customerId !== "string" || !customerId) return NextResponse.json({ error: "Valitse tilaaja." }, { status: 400 });
  const { data: customer } = await supabase.from("customers").select("id").eq("id", customerId).eq("company_id", companyId).maybeSingle();
  if (!customer) return NextResponse.json({ error: "Tilaajaa ei löytynyt." }, { status: 404 });
  const { data: project, error: insertError } = await supabase.from("projects").insert({ company_id: companyId, customer_id: customerId, name: name.trim(), location: typeof location === "string" && location.trim() ? location.trim() : null, project_type: typeof projectType === "string" && projectType.trim() ? projectType.trim() : null, status: "offer" }).select("id").single();
  if (insertError || !project) return NextResponse.json({ error: insertError?.message ?? "Työmaata ei voitu luoda." }, { status: 400 });
  return NextResponse.json({ id: project.id }, { status: 201 });
}
