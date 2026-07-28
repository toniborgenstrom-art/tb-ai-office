import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { name, location } = await request.json();
  if (typeof name !== "string" || !name.trim()) return NextResponse.json({ error: "Kohteen nimi puuttuu." }, { status: 400 });
  const { error: insertError } = await supabase.from("projects").insert({ company_id: companyId, name: name.trim(), location: location?.trim() || null });
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
