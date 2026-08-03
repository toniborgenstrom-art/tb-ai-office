"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type RegisteredOffer = {
  id: string; title: string; offerNumber: string; amount: number | null; expiresAt: string;
  status: string; source: string; projectId: string; projectName: string; description: string; region: string; sourceUrl: string;
};
type ProjectChoice = { id: string; name: string; location: string };

const labels: Record<string, string> = { new: "Uusi tarjouspyyntö", draft: "Luonnos", sent: "Lähetetty", won: "Voitettu", lost: "Hävitty", declined: "Ei jatkoon" };
const euro = (amount: number | null) => amount === null ? "—" : amount.toLocaleString("fi-FI", { style: "currency", currency: "EUR" });

export function OfferRegister({ offers, projects }: { offers: RegisteredOffer[]; projects: ProjectChoice[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<RegisteredOffer | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!editing) return;
    setSaving(true); setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/offers/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
      title: form.get("title"), offerNumber: form.get("offerNumber"), amount: form.get("amount"), expiresAt: form.get("expiresAt"), status: form.get("status"),
      source: form.get("source"), region: form.get("region"), sourceUrl: form.get("sourceUrl"), description: form.get("description"), projectId: form.get("projectId")
    }) });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Tarjouksen päivitys epäonnistui."); else { setEditing(null); router.refresh(); }
    setSaving(false);
  }

  async function remove() {
    if (!editing || !confirm(`Poistetaanko tarjous “${editing.offerNumber || editing.title}” AI Officesta?`)) return;
    setSaving(true); setError("");
    const response = await fetch(`/api/offers/${editing.id}`, { method: "DELETE" });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Tarjouksen poisto epäonnistui."); else { setEditing(null); router.refresh(); }
    setSaving(false);
  }

  async function createProject() {
    if (!editing || !confirm("Luodaanko voitetusta tarjouksesta uusi kohde/työmaa?")) return;
    setSaving(true); setError("");
    const response = await fetch(`/api/offers/${editing.id}/create-project`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Kohdetta ei voitu luoda."); else { setEditing(null); router.refresh(); }
    setSaving(false);
  }

  const active = offers.filter((offer) => ["draft", "sent"].includes(offer.status));
  const sentValue = offers.filter((offer) => offer.status === "sent").reduce((total, offer) => total + (offer.amount ?? 0), 0);

  return <>
    <div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#a67a00]">Tarjousten hallinta</p><h1 className="mt-2 text-3xl font-semibold">Tarjoukset</h1><p className="mt-2 max-w-3xl text-sm text-[#607188]">Kaikki tarjoukset samassa rekisterissä. Avaa tarjous muokataksesi sen tietoja, tilaa ja seurantaa.</p></div>
    <section className="mt-8 grid gap-4 sm:grid-cols-3">
      <Metric label="Aktiiviset tarjoukset" value={String(active.length)} hint="Luonnokset ja lähetetyt" color="#d9ae16" />
      <Metric label="Lähetetty tarjouskanta" value={euro(sentValue)} hint="Lähetettyjen tarjousten arvo" color="#70a7e8" />
      <Metric label="Voitetut" value={String(offers.filter((offer) => offer.status === "won").length)} hint="Seurannassa" color="#1f6b56" />
    </section>
    {error && <p className="mt-5 border border-red-300 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    <div className="mt-8 overflow-x-auto border border-[#d6dee7] bg-white"><div className="min-w-[900px] grid grid-cols-[1.4fr_.9fr_.65fr_.65fr_.7fr_auto] gap-4 border-b bg-[#f4f7fa] px-5 py-3 text-xs font-semibold uppercase text-[#607188]"><span>Tarjous</span><span>Kohde / lähde</span><span>Voimassa</span><span>Summa</span><span>Tila</span><span></span></div>
      {offers.length ? offers.map((offer) => <div key={offer.id} className="min-w-[900px] grid grid-cols-[1.4fr_.9fr_.65fr_.65fr_.7fr_auto] items-center gap-4 border-b border-[#e4e9ef] px-5 py-4 text-sm"><div><b>{offer.offerNumber || offer.title}</b>{offer.offerNumber && <p className="mt-1 text-xs text-[#607188]">{offer.title}</p>}</div><span className="text-[#607188]">{offer.projectName || offer.region || offer.source || "—"}</span><span>{offer.expiresAt || "—"}</span><span>{euro(offer.amount)}</span><span className="rounded bg-[#eef3f7] px-2 py-1 text-xs font-medium text-[#253d58]">{labels[offer.status] || offer.status}</span><button onClick={() => { setError(""); setEditing(offer); }} className="text-xs font-semibold text-[#142b45] underline">Avaa ja muokkaa</button></div>) : <p className="p-8 text-sm text-[#607188]">Ei vielä tarjouksia.</p>}
    </div>
    {editing && <div className="fixed inset-0 z-50 overflow-y-auto bg-[#142b45]/55 p-4 sm:p-8"><form onSubmit={save} className="mx-auto my-4 w-full max-w-3xl bg-white p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[.14em] text-[#a67a00]">Tarjouksen tiedot</p><h2 className="mt-1 text-2xl font-semibold">Muokkaa tarjousta</h2></div><button type="button" onClick={() => setEditing(null)} className="text-sm underline">Sulje</button></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Tarjouksen nimi"><input name="title" defaultValue={editing.title} required className="input" /></Field><Field label="Tarjousnumero"><input name="offerNumber" defaultValue={editing.offerNumber} placeholder="TB-2026-001" className="input" /></Field><Field label="Summa, alv 0 %"><input name="amount" type="number" min="0" step="0.01" defaultValue={editing.amount ?? ""} className="input" /></Field><Field label="Voimassa asti"><input name="expiresAt" type="date" defaultValue={editing.expiresAt} className="input" /></Field><Field label="Tila"><select name="status" defaultValue={editing.status} className="input">{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field><Field label="Kohdista olemassa olevaan kohteeseen"><select name="projectId" defaultValue={editing.projectId} className="input"><option value="">Ei kohdistusta</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}{project.location ? ` · ${project.location}` : ""}</option>)}</select></Field><Field label="Lähde"><input name="source" defaultValue={editing.source} placeholder="Tarjoustyökalu" className="input" /></Field><Field label="Alue / kohde"><input name="region" defaultValue={editing.region} placeholder="Hyvinkää" className="input" /></Field><Field label="Tarjouspyynnön linkki"><input name="sourceUrl" type="url" defaultValue={editing.sourceUrl} placeholder="https://…" className="input" /></Field></div>
      <Field label="Kuvaus / muistiinpanot"><textarea name="description" defaultValue={editing.description} rows={5} className="input resize-y" placeholder="Mitä tarjous sisältää, sovitut asiat ja seuraavat toimet…" /></Field>
      <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e9ef] pt-5"><div className="flex gap-4"><button type="button" disabled={saving} onClick={remove} className="text-sm font-semibold text-red-700 underline disabled:opacity-50">Poista tarjous</button>{!editing.projectId && <button type="button" disabled={saving} onClick={createProject} className="text-sm font-semibold text-[#1f6b56] underline disabled:opacity-50">Voitettu → luo kohde ja työmaa</button>}</div><div className="flex gap-3"><button type="button" onClick={() => setEditing(null)} className="px-3 py-3 text-sm underline">Peruuta</button><button disabled={saving} className="rounded bg-[#d9ae16] px-5 py-3 font-semibold disabled:opacity-50">{saving ? "Tallennetaan…" : "Tallenna muutokset"}</button></div></div>
      <p className="mt-4 text-xs text-[#607188]">Huom. Tarjoustyökalussa oleva tarjous säilyy siellä. Jos synkronoit sen myöhemmin uudelleen, poistettu tarjous voidaan tuoda takaisin AI Officeen.</p>
    </form></div>}
  </>;
}

function Metric({ label, value, hint, color }: { label: string; value: string; hint: string; color: string }) { return <div className="border border-[#d6dee7] border-t-4 bg-white p-5" style={{ borderTopColor: color }}><p className="text-xs font-semibold uppercase text-[#607188]">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p><p className="mt-1 text-xs text-[#607188]">{hint}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="mt-4 block text-sm font-medium text-[#253d58]">{label}<span className="mt-2 block">{children}</span></label>; }
