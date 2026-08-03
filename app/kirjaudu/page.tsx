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

  return <main className="grid min-h-screen place-items-center bg-[#eef2f6] p-5 text-[#142b45]"><section className="w-full max-w-md border border-[#d6dee7] border-t-4 border-t-[#d9ae16] bg-white p-7 shadow-lg"><div><img src="/lvi-valvonta-tb-logo.png" alt="LVI-Valvonta T.B" className="h-auto w-44 rounded border border-[#d6dee7] p-1" /><h1 className="mt-3 font-semibold">TB AI Office</h1><p className="text-xs text-[#607188]">LVI-Valvonta T.B</p></div><h2 className="mt-8 text-2xl font-semibold">Kirjaudu työtilaan</h2><p className="mt-2 text-sm leading-6 text-[#607188]">Lähetämme kertakäyttöisen kirjautumislinkin sähköpostiisi.</p><form onSubmit={signIn} className="mt-6 space-y-3"><label className="block text-sm font-medium" htmlFor="email">Sähköposti</label><input id="email" type="email" required value={email} onChange={event => setEmail(event.target.value)} placeholder="toni@yritys.fi" className="w-full rounded border border-[#cfd8e2] bg-white px-4 py-3 outline-none placeholder:text-[#8b9aaa] focus:border-[#d9ae16]"/><button disabled={loading} className="w-full rounded bg-[#d9ae16] px-4 py-3 font-semibold text-[#142b45] disabled:opacity-50">{loading ? "Lähetetään…" : "Lähetä kirjautumislinkki"}</button></form>{message && <p className="mt-4 rounded bg-[#eef3f7] p-3 text-sm text-[#52657c]">{message}</p>}</section></main>;
}

export default function LoginPage() {
  return <Suspense fallback={<main className="grid min-h-screen place-items-center bg-[#eef2f6] text-sm text-[#607188]">Ladataan kirjautumista…</main>}><LoginForm /></Suspense>;
}
