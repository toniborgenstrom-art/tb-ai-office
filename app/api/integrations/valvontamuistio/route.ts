import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

type MemoProject = {
  id?: unknown;
  name?: unknown;
  address?: unknown;
  reportNumber?: unknown;
  reportDate?: unknown;
  updatedAt?: unknown;
  officeInspectionId?: unknown;
  state?: { fields?: Record<string, unknown> };
};

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

export async function POST(request: Request) {
  const secret = process.env.TB_MEMO_SYNC_SECRET;
  if (!secret || request.headers.get("x-tb-memo-sync-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: "Valvontamuistion synkronointi ei ole viela palvelimella maaritetty." }, { status: 503 });
  }

  const body = await request.json().catch(() => null) as { email?: unknown; project?: MemoProject } | null;
  const email = text(body?.email).toLowerCase();
  const project = body?.project;
  const externalId = text(project?.id);
  if (!email || !externalId || !project) {
    return NextResponse.json({ error: "Kayttajan sahkoposti tai katselmustunnus puuttuu." }, { status: 400 });
  }

  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: authData, error: authError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (authError) return NextResponse.json({ error: authError.message }, { status: 500 });
  const authUser = authData.users.find((user) => user.email?.toLowerCase() === email);
  if (!authUser) return NextResponse.json({ error: "AI Office -kayttajaa ei loydy samalla sahkopostilla." }, { status: 404 });

  const { data: profile, error: profileError } = await admin.from("users").select("company_id").eq("id", authUser.id).maybeSingle();
  if (profileError || !profile?.company_id) return NextResponse.json({ error: profileError?.message || "Tyotilaa ei loydy." }, { status: 404 });

  const fields = project.state?.fields ?? {};
  const title = text(fields.kat_otsikko) || "Yleinen katselmuspoytakirja";
  const target = text(project.name) || text(fields.kohde_nimi) || "Kohdistamaton katselmus";
  const path = `valvontamuistio:${externalId}`;
  const name = `${title} - ${target}`.slice(0, 240);
  const { data: existing, error: existingError } = await admin
    .from("documents")
    .select("id,project_id")
    .eq("company_id", profile.company_id)
    .eq("storage_path", path)
    .maybeSingle();
  if (existingError) return NextResponse.json({ error: existingError.message }, { status: 500 });

  const payload = {
    company_id: profile.company_id,
    project_id: existing?.project_id ?? null,
    name,
    storage_path: path,
    mime_type: "application/vnd.tb-ai-office.valvontamuistio+json"
  };
  const result = existing
    ? await admin.from("documents").update(payload).eq("id", existing.id).eq("company_id", profile.company_id)
    : await admin.from("documents").insert(payload);
  if (result.error) return NextResponse.json({ error: result.error.message }, { status: 400 });

  // Keep a readable snapshot from the field app. This is deliberately stored
  // as source material only: AI can create a reviewable draft later, never a
  // final report or external message automatically.
  const documentId = existing?.id ?? (await admin.from("documents").select("id").eq("company_id", profile.company_id).eq("storage_path", path).single()).data?.id;
  if (documentId) {
    const sourceText = JSON.stringify({ title, target, reportNumber: text(project.reportNumber), reportDate: text(project.reportDate), fields }, null, 2);
    const review = await admin.from("document_ai_reviews").upsert({ company_id: profile.company_id, document_id: documentId, source_text: sourceText, status: "pending", updated_at: new Date().toISOString() }, { onConflict: "document_id" });
    if (review.error) return NextResponse.json({ error: `Katselmuksen sisällön tallennus epäonnistui: ${review.error.message}` }, { status: 400 });
  }

  const inspectionId = text(project.officeInspectionId);
  if (inspectionId) {
    const update = await admin.from("project_inspections").update({ status: "completed", updated_at: new Date().toISOString() }).eq("id", inspectionId).eq("company_id", profile.company_id);
    if (update.error && !update.error.message.includes("project_inspections")) return NextResponse.json({ error: update.error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, documentId: documentId ?? null, assigned: Boolean(existing?.project_id) });
}
