"use client";

import { useRouter } from "next/navigation";

const labels: Record<string, string> = {
  draft: "Tallennettu",
  sent: "Laskutettu",
  paid: "Maksettu",
  overdue: "Myöhässä",
  cancelled: "Peruttu",
};

export function InvoiceStatus({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  async function setStatus(next: string) {
    const response = await fetch(`/api/invoices/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) });
    if (response.ok) router.refresh();
  }
  return <select aria-label="Laskun tila" value={status} onChange={event => setStatus(event.target.value)} className="border border-[#cfd8e2] bg-white px-2 py-1 text-xs font-semibold">{Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>;
}
