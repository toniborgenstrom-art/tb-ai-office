"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type WatchedOffer = { id: string; title: string; source: string | null; fitScore: number | null; description: string; region: string; address: string; serviceType: string; sourceUrl: string; deadline: string; reasons: string[]; estimate: string; recommendation: string };

type EditorProps = { title: string; description: string; region: string; address: string; serviceType: string; source: string; sourceUrl: string; deadline: string };
const emptyEditor: EditorProps = { title: "", description: "", region: "", address: "", serviceType: "", source: "", sourceUrl: "", deadline: "" };

export function OfferWatch({ offers }: { offers: WatchedOffer[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<WatchedOffer | null>(null);
  const [saving, setSaving] = useState(false);
  const [scoring, setScoring] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    const payload = { title: form.get("title"), description: form.get("description"), region: form.get("region"), address: form.get("address"), serviceType: form.get("serviceType"), source: form.get("source"), sourceUrl: form.get("sourceUrl"), deadline: form.get("deadline") };
    const endpoint = editing ? `/api/offers/${editing.id}` : "/api/offers";
    const response = await fetch(endpoint, { method: editing ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Tallennus epäonnistui."); else { setCreating(false); setEditing(null); router.refresh(); }
    setSaving(false);
  }

  async function score(id: string) {
    setScoring(id); setError("");
    const response = await fetch(`/api/offers/${id}/score`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) setError(data.error || "AI-arviointi epäonnistui."); else router.refresh();
    setScoring(null);
  }

  async function syncHilma() {
    setSyncing(true); setError("");
    const { data: { session } } = await createClient().auth.getSession();
    if (!session?.access_token) {
      setError("Kirjaudu uudelleen ennen Hilma-hakua.");
      setSyncing(false);
      return;
    }
    const response = await fetch("/.netlify/functions/hilma-manual", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
      signal: AbortSignal.timeout(35_000),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Hilma-haku epäonnistui.");
    else { setError(`Hilma tarkistettu: ${data.found} ilmoitusta, ${data.imported} uutta tallennettu.`); router.refresh(); }
    setSyncing(false);
  }

  const editor: EditorProps = editing ? { title: editing.title, description: editing.description, region: editing.region, address: editing.address, serviceType: editing.serviceType, source: editing.source ?? "", sourceUrl: editing.sourceUrl, deadline: editing.deadline } : emptyEditor;
  return <>
    <div className="mb-4 flex justify-end"><button onClick={syncHilma} disabled={syncing} className="rounded border border-[#112b49] px-4 py-2.5 text-sm font-semibold text-[#142b45] disabled:opacity-50">{syncing ? "Haetaan Hilmasta…" : "Hae Hilmasta nyt"}</button></div>
    <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#a67a00]">24/7 tarjousseuranta</p><h1 className="mt-2 text-3xl font-semibold">Tarjousvahti</h1><p className="mt-2 max-w-3xl text-sm text-[#607188]">Tarjouspyyntö arvioidaan alkuperäisen lähdesivun sekä lisäämiesi tietojen perusteella.</p></div><button onClick={() => setCreating(true)} className="rounded bg-[#d9ae16] px-4 py-2.5 text-sm font-semibold text-[#142b45]">+ Lisää tarjouspyyntö</button></div>
    {error && <p className="mt-5 border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="mt-8 grid gap-4">{offers.length ? offers.map((offer) => <article key={offer.id} className="border border-[#d6dee7] border-t-4 border-t-[#d9ae16] bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs text-[#607188]">{offer.source || "Oma lisäys"}{offer.region ? ` · ${offer.region}` : ""}</p><h2 className="mt-1 text-lg font-semibold">{offer.title}</h2><p className="mt-2 max-w-3xl text-sm text-[#52657c]">{offer.description}</p><div className="mt-3 flex flex-wrap gap-2 text-xs">{offer.serviceType && <span className="rounded bg-[#edf4fb] px-3 py-1.5 text-[#253d58]">Palvelu: {offer.serviceType}</span>}{offer.address && <span className="rounded bg-[#edf4fb] px-3 py-1.5 text-[#253d58]">Osoite: {offer.address}</span>}</div>{offer.sourceUrl ? <a href={offer.sourceUrl} target="_blank" rel="noreferrer" className="mt-3 inline-block text-xs font-medium text-[#142b45] underline">Avaa alkuperäinen tarjouspyyntö ↗</a> : <p className="mt-3 text-xs font-medium text-[#a67a00]">Lähdelinkki puuttuu — arvio tehdään annettujen tietojen perusteella.</p>}</div><div className="rounded bg-[#f8edc1] px-4 py-3 text-right"><p className="text-2xl font-semibold text-[#735400]">{offer.fitScore ?? "–"}{offer.fitScore !== null ? "%" : ""}</p><p className="text-xs text-[#607188]">sopivuus</p></div></div><div className="mt-4 flex flex-wrap gap-2 text-xs">{offer.reasons.map((reason) => <span key={reason} className="rounded bg-[#eef3f7] px-3 py-1.5 text-[#52657c]">{reason}</span>)}{offer.estimate && <span className="rounded bg-[#eef3f7] px-3 py-1.5 text-[#52657c]">Työmäärä: {offer.estimate}</span>}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#e1e7ed] pt-4"><span className={offer.recommendation === "Tee tarjous" ? "text-sm font-semibold text-[#1f6b56]" : "text-sm font-medium text-[#a67a00]"}>{offer.recommendation}</span><div className="flex gap-2"><button onClick={() => setEditing(offer)} className="rounded border border-[#112b49] px-3 py-2 text-xs font-semibold text-[#142b45]">Täydennä tiedot</button><button onClick={() => score(offer.id)} disabled={scoring === offer.id} className="rounded bg-[#112b49] px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45">{scoring === offer.id ? "AI arvioi…" : "AI-arvioi"}</button></div></div></article>) : <div className="border border-dashed border-[#b9c7d7] bg-white p-8 text-center text-sm text-[#607188]">Ei vielä tarjouspyyntöjä. Lisää ensimmäinen tarjouspyyntö.</div>}</div>
    {(creating || editing) && <div className="fixed inset-0 z-50 grid place-items-center bg-[#142b45]/55 p-4"><form onSubmit={save} className="max-h-[90vh] w-full max-w-xl overflow-auto bg-white p-6 shadow-2xl"><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#a67a00]">Tarjousvahti</p><h2 className="mt-1 text-xl font-semibold">{editing ? "Täydennä tarjouspyyntö" : "Lisää tarjouspyyntö"}</h2><p className="mt-2 text-sm text-[#607188]">Osoite, alue ja palvelulaji tekevät AI-arviosta käyttökelpoisen. Lähdelinkki täydentää arviota, mutta ei ole pakollinen.</p><label className="mt-5 block text-sm font-medium">Tarjouspyynnön nimi<input required name="title" defaultValue={editor.title} disabled={Boolean(editing)} className="mt-2 w-full border border-[#cfd8e2] p-3 disabled:bg-[#f4f7fa]" /></label><label className="mt-3 block text-sm font-medium">Kuvaus / palvelusisältö<textarea required name="description" defaultValue={editor.description} rows={4} className="mt-2 w-full border border-[#cfd8e2] p-3" /></label><div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm font-medium">Palvelulaji<select name="serviceType" defaultValue={editor.serviceType} className="mt-2 w-full border border-[#cfd8e2] p-3"><option value="">Valitse palvelu</option><option>LVI-valvonta</option><option>KVV-työnjohtaja</option><option>IV-työnjohtaja</option><option>Rakennuttajakonsultti</option><option>Talotekniikka</option><option>Kuntotutkimus</option><option>Sisäilma</option><option>Korjaussuunnittelu</option></select></label><label className="text-sm font-medium">Osoite / paikkakunta<input name="address" defaultValue={editor.address} placeholder="Esim. Hyvinkää tai katuosoite" className="mt-2 w-full border border-[#cfd8e2] p-3" /></label><label className="text-sm font-medium">Toiminta-alue<input name="region" defaultValue={editor.region} placeholder="Uusimaa" className="mt-2 w-full border border-[#cfd8e2] p-3" /></label><label className="text-sm font-medium">Lähde<input name="source" defaultValue={editor.source} placeholder="Hilma, Cloudia…" className="mt-2 w-full border border-[#cfd8e2] p-3" /></label></div><label className="mt-3 block text-sm font-medium">Alkuperäisen tarjouspyynnön linkki <span className="font-normal text-[#607188]">(valinnainen)</span><input name="sourceUrl" type="url" defaultValue={editor.sourceUrl} placeholder="https://…" className="mt-2 w-full border border-[#cfd8e2] p-3" /></label><label className="mt-3 block text-sm font-medium">Tarjousaika päättyy<input name="deadline" type="date" defaultValue={editor.deadline} className="mt-2 w-full border border-[#cfd8e2] p-3" /></label><div className="mt-6 flex gap-3"><button disabled={saving} className="rounded bg-[#d9ae16] px-4 py-3 font-semibold disabled:opacity-50">{saving ? "Tallennetaan…" : "Tallenna tiedot"}</button><button type="button" onClick={() => { setCreating(false); setEditing(null); }} className="text-sm underline">Peruuta</button></div></form></div>}
  </>;
}
