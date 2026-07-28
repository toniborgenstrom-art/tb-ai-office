export function StatCard({ label, value, detail, tone = "slate" }: { label: string; value: string; detail: string; tone?: "slate" | "green" }) {
  return <article className="rounded-2xl border border-white/10 bg-[#101d18] p-5"><p className="text-sm text-[#9fb3a8]">{label}</p><p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p><p className={`mt-2 text-xs ${tone === "green" ? "text-[#78e69d]" : "text-[#9fb3a8]"}`}>{detail}</p></article>;
}
