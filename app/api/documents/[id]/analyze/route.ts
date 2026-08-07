import OpenAI from "openai";
import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

export async function POST(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "AI-avain puuttuu palvelinympäristöstä." }, { status: 503 });
  const { id } = await params;
  const { data: review, error: reviewError } = await supabase.from("document_ai_reviews").select("id,source_text").eq("document_id", id).eq("company_id", companyId).maybeSingle();
  if (reviewError || !review) return NextResponse.json({ error: "Asiakirjan sisältö ei ole vielä käytettävissä. Varmista, että Supabase-migraatio on ajettu ja tallenna katselmus pilveen uudelleen." }, { status: 404 });
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const result = await client.chat.completions.create({ model: process.env.OPENAI_MODEL ?? "gpt-4.1-mini", temperature: 0.2, messages: [{ role: "system", content: "Olet LVI-valvonnan asiakirja-avustaja. Tee vain annetun aineiston perusteella suomenkielinen, tarkistettava yhteenveto. Älä keksi teknisiä, juridisia tai sopimuksellisia tietoja. Vastaa otsikoilla: Yhteenveto, Havaittavat jatkotoimet, Raporttiluonnos." }, { role: "user", content: review.source_text.slice(0, 45000) }] });
  const draft = result.choices[0]?.message.content ?? "Luonnosta ei saatu muodostettua.";
  const { error: updateError } = await supabase.from("document_ai_reviews").update({ summary: draft, draft, status: "ready", updated_at: new Date().toISOString() }).eq("id", review.id).eq("company_id", companyId);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });
  return NextResponse.json({ ok: true, draft });
}
