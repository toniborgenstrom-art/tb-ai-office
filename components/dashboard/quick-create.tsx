"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Kind = "task" | "customer" | "project";
const labels: Record<Kind, string> = { task: "Tehtävä", customer: "Asiakas", project: "Kohde" };

export function QuickCreate() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("task");
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true); setError("");
    const body = kind === "task" ? { title } : kind === "customer" ? { name: title, contactName: detail } : { name: title, location: detail };
    try {
      const response = await fetch(`/api/${kind === "task" ? "tasks" : kind === "customer" ? "customers" : "projects"}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Tallennus epäonnistui.");
      setOpen(false); setTitle(""); setDetail(""); router.refresh();
    } catch (err) { setError(err instanceof Error ? err.message : "Tallennus epäonnistui."); }
    finally { setSaving(false); }
  }

  return <><button onClick={() => setOpen(true)} className="rounded-xl bg-[#78e69d] px-4 py-2.5 text-sm font-semibold text-[#07110b]">+ Uusi tehtävä</button>{open && <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"><form onSubmit={save} className="w-full max-w-md rounded-2xl border border-white/10 bg-[#101d18] p-6 shadow-2xl"><div className="flex items-center justify-between"><h2 className="text-xl font-semibold">Lisää työtilaan</h2><button type="button" onClick={() => setOpen(false)} className="text-[#9fb3a8]">Sulje</button></div><div className="mt-5 flex gap-2">{(Object.keys(labels) as Kind[]).map(item => <button key={item} type="button" onClick={() => { setKind(item); setTitle(""); setDetail(""); }} className={`rounded-lg px-3 py-2 text-sm ${kind === item ? "bg-[#78e69d] font-medium text-[#07110b]" : "bg-white/5 text-[#b8c9be]"}`}>{labels[item]}</button>)}</div><label className="mt-5 block text-sm">{kind === "task" ? "Tehtävän otsikko" : kind === "customer" ? "Asiakkaan nimi" : "Kohteen nimi"}<input required value={title} onChange={event => setTitle(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09100e] px-4 py-3 outline-none focus:border-[#78e69d]" /></label>{kind !== "task" && <label className="mt-4 block text-sm">{kind === "customer" ? "Yhteyshenkilö (valinnainen)" : "Sijainti (valinnainen)"}<input value={detail} onChange={event => setDetail(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-[#09100e] px-4 py-3 outline-none focus:border-[#78e69d]" /></label>}{error && <p className="mt-4 rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}<button disabled={saving} className="mt-6 w-full rounded-xl bg-[#78e69d] px-4 py-3 font-semibold text-[#07110b] disabled:opacity-50">{saving ? "Tallennetaan…" : `Tallenna ${labels[kind].toLowerCase()}`}</button></form></div>}</>;
}
