import { createClient } from "@supabase/supabase-js";
import { syncHilmaWithClient } from "../../lib/hilma/sync";

function json(body: Record<string, unknown>, status = 200) {
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export default async (request: Request) => {
  if (request.method !== "POST") return json({ error: "Vain POST-pyyntö on sallittu." }, 405);

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "").trim();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!token || !url || !publishableKey) return json({ error: "Kirjautuminen tai Supabase-asetukset puuttuvat." }, 401);

  const auth = createClient(url, publishableKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { data: { user }, error: authError } = await auth.auth.getUser(token);
  if (authError || !user) return json({ error: "Kirjaudu uudelleen ennen Hilma-hakua." }, 401);

  const database = createClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  const { data: profile, error: profileError } = await database.from("users").select("company_id").eq("id", user.id).maybeSingle();
  if (profileError || !profile?.company_id) return json({ error: "Työtilaa ei löytynyt." }, 403);

  try {
    const result = await syncHilmaWithClient(database, profile.company_id, (name) => process.env[name]);
    return json({ ok: true, ...result });
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : "Hilma-haku epäonnistui.";
    console.error("Hilma manual sync:", message);
    return json({ error: message }, 502);
  }
};
