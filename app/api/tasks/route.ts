import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { title } = await request.json();
  if (typeof title !== "string" || !title.trim()) return NextResponse.json({ error: "Tehtävän otsikko puuttuu." }, { status: 400 });
  const { error: insertError } = await supabase.from("tasks").insert({ company_id: companyId, title: title.trim() });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
