"use client";
import { useState } from "react";
export function DocumentAiReview({ documentId, initialDraft }: { documentId: string; initialDraft?: string | null }) {
  const [draft, setDraft] = useState(initialDraft ?? ""); const [loading, setLoading] = useState(false); const [error, setError] = useState("");
  async function run() { setLoading(true); setError(""); const res = await fetch(`/api/documents/${documentId}/analyze`, { method: "POST" }); const data = await res.json().catch(() => ({})); if (!res.ok) setError(data.error || "AI-yhteenveto epäonnistui."); else setDraft(data.draft); setLoading(false); }
  return <div className="mt-3"><button onClick={run} disabled={loading} className="rounded border border-[#112b49] bg-white px-3 py-2 text-xs font-semibold text-[#112b49] disabled:opacity-50">{loading ? "Luodaan luonnosta…" : draft ? "Päivitä AI-luonnos" : "Tee AI-yhteenveto"}</button>{error && <p className="mt-2 text-xs text-red-700">{error}</p>}{draft && <pre className="mt-3 whitespace-pre-wrap border border-[#d6dee7] bg-[#f8fafc] p-3 text-xs leading-5 text-[#253d58]">{draft}</pre>}</div>;
}
