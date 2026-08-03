"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function InvoiceAssignButton({ invoiceId, projectId }: { invoiceId: string; projectId: string }) {
  const router = useRouter(); const [saving, setSaving] = useState(false); const [error, setError] = useState("");
  async function assign() { setSaving(true); setError(""); const response = await fetch(`/api/invoices/${invoiceId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ projectId }) }); const data = await response.json(); if (!response.ok) setError(data.error || "Kohdistus epäonnistui."); else router.refresh(); setSaving(false); }
  return <div><button onClick={assign} disabled={saving} className="rounded bg-[#d9ae16] px-3 py-2 text-xs font-semibold text-[#142b45]">{saving ? "Kohdistetaan…" : "Kohdista tähän työmaahan"}</button>{error && <p className="mt-1 text-xs text-red-700">{error}</p>}</div>;
}
