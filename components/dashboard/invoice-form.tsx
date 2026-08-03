"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Project = { id: string; name: string };

export function InvoiceForm({ projects, defaultProjectId }: { projects: Project[]; defaultProjectId?: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const selectedProject = defaultProjectId ? projects.find(project => project.id === defaultProjectId) : undefined;

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const response = await fetch("/api/invoices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: form.get("projectId"), invoiceNumber: form.get("invoiceNumber"), amount: form.get("amount"), dueDate: form.get("dueDate") }) });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Tallennus epäonnistui.");
    else { setOpen(false); router.refresh(); }
    setSaving(false);
  }

  return <>
    <button onClick={() => setOpen(true)} className="rounded bg-[#d9ae16] px-4 py-2.5 text-sm font-semibold text-[#142b45]">+ Tallenna lasku</button>
    {open && <div className="fixed inset-0 z-50 grid place-items-center bg-[#142b45]/55 p-4"><form onSubmit={save} className="w-full max-w-md border border-[#d6dee7] bg-white p-6 shadow-2xl">
      <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#a67a00]">Kirjanpitäjän lasku</p><h2 className="mt-1 text-xl font-semibold">Tallenna laskun tiedot</h2><p className="mt-2 text-sm text-[#607188]">Laskua ei lähetetä tästä palvelusta. Tallenna se vain seurantaa varten.</p>
      {selectedProject ? <><input type="hidden" name="projectId" value={selectedProject.id} /><p className="mt-5 rounded border border-[#d6dee7] bg-[#f4f7fa] p-3 text-sm"><b>Kohde:</b> {selectedProject.name}</p></> : <label className="mt-5 block text-sm font-medium">Kohde<select required name="projectId" className="mt-2 w-full border border-[#cfd8e2] p-3"><option value="">Valitse kohde</option>{projects.map(project => <option key={project.id} value={project.id}>{project.name}</option>)}</select></label>}
      <label className="mt-4 block text-sm font-medium">Kirjanpitäjän laskunumero<input required name="invoiceNumber" placeholder="LVI-2026-001" className="mt-2 w-full border border-[#cfd8e2] p-3" /></label><label className="mt-4 block text-sm font-medium">Laskun summa, alv 0 %<input required name="amount" type="number" min="0" step="0.01" className="mt-2 w-full border border-[#cfd8e2] p-3" /></label><label className="mt-4 block text-sm font-medium">Eräpäivä<input name="dueDate" type="date" className="mt-2 w-full border border-[#cfd8e2] p-3" /></label>
      {error && <p className="mt-3 text-sm text-red-700">{error}</p>}<div className="mt-6 flex gap-3"><button disabled={saving} className="rounded bg-[#d9ae16] px-4 py-3 font-semibold">{saving ? "Tallennetaan…" : "Tallenna seurantaan"}</button><button type="button" onClick={() => setOpen(false)} className="text-sm underline">Peruuta</button></div>
    </form></div>}
  </>;
}
