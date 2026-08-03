import { syncHilmaWithClient } from "@/lib/hilma/sync";
import { getCurrentWorkspace } from "@/lib/supabase/current-user";
import { NextResponse } from "next/server";

export async function POST() {
  const { supabase, companyId, error } = await getCurrentWorkspace();
  if (error || !companyId) return NextResponse.json({ error }, { status: 401 });
  try {
    return NextResponse.json({ ok: true, ...(await syncHilmaWithClient(supabase, companyId)) });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Hilma-haku epäonnistui.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
