import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  const { title, description, region, source, sourceUrl, deadline } = await request.json();
  if (typeof title !== "string" || !title.trim() || typeof description !== "string" || !description.trim()) {
    return NextResponse.json({ error: "Täytä vähintään tarjouspyynnön nimi ja kuvaus." }, { status: 400 });
  }
  const content = JSON.stringify({
    description: description.trim(),
    region: typeof region === "string" ? region.trim() : "",
    sourceUrl: typeof sourceUrl === "string" ? sourceUrl.trim() : "",
    deadline: typeof deadline === "string" ? deadline : "",
    reasons: [],
    estimate: "Arvioitava asiakirjoista",
    recommendation: "Arvioimatta",
  });
  const { data, error: insertError } = await supabase
    .from("offers")
    .insert({ company_id: companyId, title: title.trim(), source: typeof source === "string" ? source.trim() : "Oma lisäys", content, status: "new" })
    .select("id")
    .single();
  if (insertError) return NextResponse.json({ error: insertError.message }, { status: 400 });
  return NextResponse.json({ id: data.id }, { status: 201 });
}
