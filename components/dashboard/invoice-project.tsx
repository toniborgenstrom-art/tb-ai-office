"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function InvoiceProject({ invoiceId, projectId, projectName, projects }: { invoiceId: string; projectId: string | null; projectName?: string; projects: { id: string; name: string }[] }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");

  async function update(payload: { projectId?: string; projectName?: string }) {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await response.json();
    if (!response.ok) setError(data.error || "Kohdistus epäonnistui.");
    else router.refresh();
    setSaving(false);
  }

  if (projectId && !projects.length) return <span className="text-xs font-semibold text-emerald-700">{projectName || "Kohde kohdistettu"}</span>;

  if (!projects.length) return <div className="min-w-56">
    <div className="flex gap-2">
      <input value={name} onChange={(event) => setName(event.target.value)} placeholder="Kirjoita kohteen nimi" className="min-w-0 border border-red-400 bg-red-50 px-2 py-1 text-xs" />
      <button disabled={saving || !name.trim()} onClick={() => update({ projectName: name })} className="border border-[#112b49] px-2 py-1 text-xs font-semibold text-[#112b49] disabled:opacity-50">Kohdista</button>
    </div>
    <p className="mt-1 text-xs text-[#607188]">Kohdetta ei löytynyt valikosta. Hae nimellä.</p>
    {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
  </div>;

  return <div>
    <select aria-label="Kohde" disabled={saving} value={projectId ?? ""} onChange={(event) => event.target.value && update({ projectId: event.target.value })} className={`max-w-52 border px-2 py-1 text-xs font-semibold ${projectId ? "border-[#cfd8e2] bg-white" : "border-red-400 bg-red-50 text-red-800"}`}>
      <option value="">Kohdistamaton – valitse kohde</option>
      {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
    </select>
    {saving && <p className="mt-1 text-xs text-[#607188]">Kohdistetaan…</p>}
    {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
  </div>;
}
