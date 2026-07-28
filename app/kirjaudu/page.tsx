"use client";

import { createClient } from "@/lib/supabase/client";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();

  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      const supabase = createClient();
      const next = searchParams.get("next") ?? "/dashboard";
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
      if (error) throw error;
      setMessage("Kirjautumislinkki lähetettiin sähköpostiisi.");
    } catch (error) { setMessage(error instanceof Error ? error.message : "Kirjautuminen epäonnistui."); }
    finally { setLoading(false); }
  }

  return <main className="grid min-h-screen place-items-center bg-[#09100e] p-5 text-[#eaf3ed]"><section className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101d18] p-7 shadow-2xl"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-[#78e69d] font-semibold text-[#07110b]">TB</span><div><h1 className="font-semibold">TB AI Office</h1><p className="text-xs text-[#9fb3a8]">LVI-Valvonta T.B</p></div></div><h2 className="mt-8 text-2xl font-semibold">Kirjaudu työtilaan</h2><p className="mt-2 text-sm leading-6 text-[#9fb3a8]">Lähetämme kertakäyttöisen kirjautumislinkin sähköpostiisi.</p><form onSubmit={signIn} className="mt-6 space-y-3"><label className="block text-sm" htmlFor="email">Sähköposti</label><input id="email" type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="toni@yritys.fi" className="w-full rounded-xl border border-white/10 bg-[#09100e] px-4 py-3 outline-none placeholder:text-[#71867a] focus:border-[#78e69d]"/><button disabled={loading} className="w-full rounded-xl bg-[#78e69d] px-4 py-3 font-semibold text-[#07110b] disabled:opacity-50">{loading ? "Lähetetään…" : "Lähetä kirjautumislinkki"}</button></form>{message && <p className="mt-4 rounded-lg bg-white/5 p-3 text-sm text-[#b8c9be]">{message}</p>}</section></main>;
}

export default function LoginPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#09100e] text-sm text-[#9fb3a8]">Ladataan kirjautumista…</main>}><LoginForm /></Suspense>;
}
