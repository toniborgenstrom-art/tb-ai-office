"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DocumentProject({ documentId, projectId, projects }: { documentId: string; projectId: string | null; projects: { id: string; name: string }[] }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  async function update(nextProjectId: string) {
    setSaving(true); setError("");
    const response = await fetch(`/api/documents/${documentId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId: nextProjectId }) });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.error || "Kohdistus epaonnistui."); else router.refresh();
    setSaving(false);
  }
  return <div><select aria-label="Kohde" disabled={saving} value={projectId ?? ""} onChange={(event) => update(event.target.value)} className={`border px-2 py-1 text-xs font-semibold ${projectId ? "border-[#cfd8e2] bg-white" : "border-red-400 bg-red-50 text-red-800"}`}><option value="">Saapuneet - valitse kohde</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select>{saving && <p className="mt-1 text-xs text-[#607188]">Kohdistetaan…</p>}{error && <p className="mt-1 text-xs text-red-700">{error}</p>}</div>;
}
