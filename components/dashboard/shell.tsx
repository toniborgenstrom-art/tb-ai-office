import Link from "next/link";

const links = [
  ["Dashboard", "/dashboard", "▦"],
  ["Tarjousvahti", "/tarjoukset", "◉"],
  ["Tarjoukset", "/tarjouskanta", "✉"],
  ["Kohteet", "/asiakkaat", "⌂"],
  ["Agentit", "/agentit", "✦"],
  ["Dokumentit", "/dokumentit", "▤"],
  ["Laskutus", "/laskutus", "€"],
];

export function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#eef2f6] text-[#142b45] md:grid md:grid-cols-[244px_1fr]">
    <aside className="border-b border-[#203954] bg-[#112b49] p-5 text-white md:min-h-screen md:border-b-0 md:border-r">
      <Link href="/dashboard" className="mb-10 block"><img src="/lvi-valvonta-tb-logo.png" alt="LVI-Valvonta T.B" className="h-auto w-40 rounded bg-white p-1" /><span className="mt-2 block text-sm font-semibold tracking-tight">TB AI Office</span><small className="mt-0.5 block text-xs font-normal text-[#b9c7d7]">LVI-Valvonta T.B</small></Link>
      <nav className="flex gap-2 overflow-auto md:flex-col">{links.map(([label, href, icon]) => <Link key={href} href={href} className="flex shrink-0 items-center gap-3 rounded-lg border border-transparent px-3 py-2.5 text-sm text-[#dce5ee] transition hover:border-white/10 hover:bg-white/10 hover:text-white"><span className="text-[#e0b21a]">{icon}</span>{label}</Link>)}</nav>
      <div className="mt-10 hidden rounded-lg border border-[#38516d] bg-[#173553] p-4 md:block"><p className="text-xs font-semibold text-[#e7bb23]">AI Foreman</p><p className="mt-1 text-xs leading-5 text-[#c7d3df]">5 agenttia seuraa työtilannettasi.</p><Link href="/agentit" className="mt-3 block text-xs font-medium text-white underline">Avaa Command Center</Link></div>
    </aside>
    <main className="p-5 sm:p-8 lg:p-10">{children}</main>
  </div>;
}
