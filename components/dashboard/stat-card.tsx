export function StatCard({ label, value, detail, tone = "slate" }: { label: string; value: string; detail: string; tone?: "slate" | "green" }) {
  return <article className="border border-[#d6dee7] border-t-4 border-t-[#d9ae16] bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-[#607188]">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight text-[#142b45]">{value}</p><p className={`mt-2 text-xs ${tone === "green" ? "font-medium text-[#1f6b56]" : "text-[#607188]"}`}>{detail}</p></article>;
}
