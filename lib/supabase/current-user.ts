import { createClient } from "@/lib/supabase/server";

export async function getCurrentWorkspace() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "Kirjautuminen vaaditaan." as const };

  const { data: profile, error } = await supabase.from("users").select("company_id").eq("id", user.id).maybeSingle();
  if (error || !profile?.company_id) return { supabase, error: "Työtilaa ei löytynyt. Aja Supabase-skeema ensin." as const };
  return { supabase, companyId: profile.company_id };
}
