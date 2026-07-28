import { Shell } from "@/components/dashboard/shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Chat } from "@/components/dashboard/chat";
import { getDashboardData } from "@/lib/dashboard/data";
import { QuickCreate } from "@/components/dashboard/quick-create";

export default async function Dashboard() {
  const data = await getDashboardData();
  const tasks = data?.tasks.length ? data.tasks : ["Lisää ensimmäinen asiakas", "Luo ensimmäinen kohde", "Arvioi uusi tarjouspyyntö"];
  const offersTotal = (data?.newOffers ?? 0) + (data?.draftOffers ?? 0) + (data?.sentOffers ?? 0);
  const offerStages = [
    ["Uudet", data?.newOffers ?? 0, "bg-[#78e69d]"],
    ["Luonnokset", data?.draftOffers ?? 0, "bg-[#f6c65b]"],
    ["Lähetetyt", data?.sentOffers ?? 0, "bg-[#70a7e8]"]
  ] as const;

  return <Shell>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div><p className="text-sm text-[#78e69d]">TB AI Office</p><h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">Hei {data?.name || ""} <span aria-hidden>👋</span></h1><p className="mt-2 text-sm text-[#9fb3a8]">Tässä on työtilasi tilanne juuri nyt.</p></div>
      <QuickCreate />
    </header>
    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <StatCard label="Tarjouspyynnöt" value={String(data?.newOffers ?? 0)} detail="Uudet käsiteltävät" tone="green" />
      <StatCard label="Työmaat" value={String(data?.activeProjects ?? 0)} detail="Aktiiviset kohteet" />
      <StatCard label="Dokumentit" value={String(data?.documentCount ?? 0)} detail="Tallennetut tiedostot" />
      <StatCard label="Asiakkaat" value={String(data?.customerCount ?? 0)} detail="Asiakasrekisterissä" tone="green" />
      <StatCard label="Avoimet tarjoukset" value={String(offersTotal)} detail="Luonnokset ja lähetetyt" />
    </section>
    <section className="mt-8 grid gap-5 xl:grid-cols-[1.2fr_.8fr]">
      <div className="rounded-2xl border border-white/10 bg-[#101d18] p-6"><div className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[.16em] text-[#78e69d]">AI suosittelee</p><h2 className="mt-2 text-xl font-semibold">Tärkeimmät seuraavat askeleet</h2></div><span className="rounded-full bg-[#78e69d]/10 px-3 py-1 text-xs text-[#78e69d]">{data?.openTasks ?? 0} avointa</span></div><div className="mt-5 divide-y divide-white/10">{tasks.map((task, index) => <div key={task} className="flex items-center gap-4 py-4"><span className="grid h-8 w-8 place-items-center rounded-lg bg-white/5 text-sm text-[#78e69d]">{index + 1}</span><p className="flex-1 text-sm">{task}</p><button className="text-xs text-[#b8c9be] underline">Avaa</button></div>)}</div></div>
      <div className="rounded-2xl border border-white/10 bg-[#101d18] p-6"><p className="text-xs font-medium uppercase tracking-[.16em] text-[#78e69d]">Tilannekuva</p><h2 className="mt-2 text-xl font-semibold">Tarjouskanta</h2><div className="mt-6 space-y-4">{offerStages.map(([label, value, color]) => <div key={label}><div className="mb-2 flex justify-between text-sm"><span>{label}</span><span className="text-[#9fb3a8]">{value}</span></div><div className="h-2 rounded-full bg-white/5"><div className={`h-2 rounded-full ${color}`} style={{ width: `${offersTotal ? Math.max(8, (value / offersTotal) * 100) : 0}%` }} /></div></div>)}</div></div>
    </section>
    <section className="mt-8"><Chat /></section>
  </Shell>;
}
