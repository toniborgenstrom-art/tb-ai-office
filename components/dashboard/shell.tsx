import Link from "next/link";

const links = [
  ["Dashboard", "/dashboard", "▦"], ["Tarjousvahti", "/tarjoukset", "◉"], ["Asiakkaat", "/asiakkaat", "♙"],
  ["Agentit", "/agentit", "✦"], ["Dokumentit", "/dokumentit", "▤"]
];

export function Shell({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-[#09100e] text-[#eaf3ed] md:grid md:grid-cols-[244px_1fr]">
    <aside className="border-b border-white/10 bg-[#0c1713] p-5 md:min-h-screen md:border-b-0 md:border-r">
      <Link href="/dashboard" className="mb-10 flex items-center gap-3 font-semibold tracking-tight"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#78e69d] text-lg text-[#07110b]">TB</span><span>TB AI Office<small className="mt-0.5 block text-xs font-normal text-[#96aaa0]">LVI-Valvonta T.B</small></span></Link>
      <nav className="flex gap-2 overflow-auto md:flex-col">{links.map(([label, href, icon]) => <Link key={href} href={href} className="flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#b8c9be] transition hover:bg-white/5 hover:text-white"><span>{icon}</span>{label}</Link>)}</nav>
      <div className="mt-10 hidden rounded-2xl border border-[#78e69d]/20 bg-[#78e69d]/5 p-4 md:block"><p className="text-xs font-medium text-[#78e69d]">AI Foreman</p><p className="mt-1 text-xs leading-5 text-[#a7bbb0]">5 agenttia seuraa työtilannettasi.</p><Link href="/agentit" className="mt-3 block text-xs text-white underline">Avaa Command Center</Link></div>
    </aside>
    <main className="p-5 sm:p-8 lg:p-10">{children}</main>
  </div>;
}
