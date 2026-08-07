"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type Inspection = { id: string; inspection_date: string; inspection_type: string; title: string; notes: string | null; status: "planned" | "completed" | "cancelled" };
type Project = { id: string; name: string; location: string | null; customerName: string | null };

const inspectionTypes = [
  ["general", "Yleinen katselmus"], ["plumbing", "Vesi- ja vesijohtotyöt"], ["drainage", "Viemärit"], ["ventilation", "Ilmanvaihto"], ["heating", "Lämmitys"], ["handover", "Luovutuskatselmus"], ["warranty", "Takuukatselmus"], ["other", "Muu katselmus"],
] as const;
const typeLabel = (type: string) => inspectionTypes.find(([value]) => value === type)?.[1] ?? "Katselmus";
const statusLabel = { planned: "Tulossa", completed: "Tehty", cancelled: "Peruttu" } as const;

function memoUrl(project: Project, inspection: Inspection) {
  const params = new URLSearchParams({
    project: project.name,
    inspectionDate: inspection.inspection_date,
    inspectionTitle: inspection.title,
    inspectionType: inspection.inspection_type,
    inspectionId: inspection.id,
  });
  if (project.location) params.set("location", project.location);
  if (project.customerName) params.set("customer", project.customerName);
  return `https://lvi-valvontamuistio-app.netlify.app/?${params.toString()}`;
}

export function ProjectInspections({ project, initialInspections, available }: { project: Project; initialInspections: Inspection[]; available: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false); const [error, setError] = useState(available ? "" : "Katselmusrekisteri ei ole vielä käytössä. Suorita Supabase-migraatio ennen käyttöä.");
  const [busy, setBusy] = useState<string | null>(null);
  async function call(url: string, method: "POST" | "PATCH" | "DELETE", data?: object) {
    setError(""); setBusy(url);
    try { const response = await fetch(url, { method, headers: data ? { "Content-Type": "application/json" } : undefined, body: data ? JSON.stringify(data) : undefined }); const result = await response.json(); if (!response.ok) throw new Error(result.error || "Toiminto epäonnistui."); setOpen(false); router.refresh(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Toiminto epäonnistui."); }
    finally { setBusy(null); }
  }
  const upcoming = initialInspections.filter((inspection) => inspection.status === "planned");
  return <section className="mt-6 border border-[#d6dee7] border-l-4 border-l-[#d9ae16] bg-white p-5">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#607188]">Katselmuskalenteri</p><h2 className="mt-1 text-xl font-semibold">Seuraavat katselmukset</h2><p className="mt-1 text-sm text-[#607188]">Luo useita tulevia käyntejä. Valvontamuistio avautuu oikealla katselmuspohjalla ja kohteen tiedoilla.</p></div><button disabled={!available} onClick={() => setOpen(true)} className="rounded bg-[#d9ae16] px-4 py-2 text-sm font-semibold text-[#142b45] disabled:cursor-not-allowed disabled:opacity-50">+ Lisää katselmus</button></div>
    {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
    {upcoming.length ? <div className="mt-5 divide-y border border-[#e4e9ef]">{upcoming.map(inspection => <div key={inspection.id} className="flex flex-wrap items-center justify-between gap-4 p-4"><div><p className="font-semibold">{new Date(`${inspection.inspection_date}T12:00:00`).toLocaleDateString("fi-FI")} · {inspection.title}</p><p className="mt-1 text-sm text-[#607188]">{typeLabel(inspection.inspection_type)}{inspection.notes ? ` · ${inspection.notes}` : ""}</p></div><div className="flex flex-wrap gap-2"><a href={memoUrl(project, inspection)} target="_blank" rel="noreferrer" className="rounded bg-[#112b49] px-3 py-2 text-xs font-semibold text-white">Avaa Valvontamuistio ↗</a><button disabled={busy !== null} onClick={() => call(`/api/projects/${project.id}/inspections/${inspection.id}`, "PATCH", { status: "completed" })} className="rounded border border-[#2c6e49] px-3 py-2 text-xs font-semibold text-[#2c6e49] disabled:opacity-50">Merkitse tehdyksi</button><button disabled={busy !== null} onClick={() => { if (confirm("Poistetaanko katselmus kalenterista?")) call(`/api/projects/${project.id}/inspections/${inspection.id}`, "DELETE"); }} className="rounded border border-red-300 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Poista</button></div></div>)}</div> : <p className="mt-5 text-sm text-[#607188]">Ei vielä sovittuja tulevia katselmuksia.</p>}
    {initialInspections.some((inspection) => inspection.status !== "planned") && <details className="mt-4 text-sm text-[#607188]"><summary className="cursor-pointer font-semibold">Näytä tehdyt ja perutut katselmukset</summary><div className="mt-3 space-y-2">{initialInspections.filter((inspection) => inspection.status !== "planned").map(inspection => <p key={inspection.id}>{new Date(`${inspection.inspection_date}T12:00:00`).toLocaleDateString("fi-FI")} · {inspection.title} <span className="text-xs">({statusLabel[inspection.status]})</span></p>)}</div></details>}
    {open && <div className="fixed inset-0 z-50 overflow-y-auto bg-[#142b45]/55 p-4"><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); call(`/api/projects/${project.id}/inspections`, "POST", { inspectionDate: form.get("inspectionDate"), inspectionType: form.get("inspectionType"), title: form.get("title"), notes: form.get("notes") }); }} className="mx-auto my-12 w-full max-w-xl bg-white p-6 shadow-2xl"><h3 className="text-xl font-semibold">Lisää katselmus</h3><p className="mt-1 text-sm text-[#607188]">Katselmuksen voi avata suoraan Valvontamuistioon tämän kohteen valmiilla tiedoilla.</p><div className="mt-5 grid gap-4"><label className="text-sm font-medium">Päivämäärä<input required name="inspectionDate" type="date" className="mt-2 w-full border border-[#c8d4e0] p-3" /></label><label className="text-sm font-medium">Katselmustyyppi<select name="inspectionType" defaultValue="general" className="mt-2 w-full border border-[#c8d4e0] p-3">{inspectionTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="text-sm font-medium">Aihe <span className="font-normal text-[#607188]">(valinnainen)</span><input name="title" placeholder="esim. Sisäpuoliset viemärit" className="mt-2 w-full border border-[#c8d4e0] p-3" /></label><label className="text-sm font-medium">Lisätiedot<textarea name="notes" rows={3} className="mt-2 w-full border border-[#c8d4e0] p-3" /></label></div><div className="mt-5 flex gap-3"><button disabled={busy !== null} className="rounded bg-[#d9ae16] px-4 py-2 font-semibold disabled:opacity-50">Tallenna katselmus</button><button type="button" onClick={() => setOpen(false)} className="underline">Peruuta</button></div></form></div>}
  </section>;
}
