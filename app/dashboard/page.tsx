import Link from "next/link";
import { Shell } from "@/components/dashboard/shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { Chat } from "@/components/dashboard/chat";
import { CreateUnifiedRecord } from "@/components/dashboard/create-unified-record";
import { getDashboardData } from "@/lib/dashboard/data";

export default async function Dashboard() {
  const data = await getDashboardData();
  const offersTotal = (data?.newOffers ?? 0) + (data?.draftOffers ?? 0) + (data?.sentOffers ?? 0);
  const stages = [
    ["Uudet", data?.newOffers ?? 0, "bg-[#d9ae16]"],
    ["Luonnokset", data?.draftOffers ?? 0, "bg-[#f6c65b]"],
    ["Lähetetyt", data?.sentOffers ?? 0, "bg-[#70a7e8]"],
  ] as const;
  const euro = (amount: number) => amount.toLocaleString("fi-FI", { style: "currency", currency: "EUR" });

  return <Shell>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[.14em] text-[#a67a00]">TB AI Office · LVI-Valvonta T.B</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#142b45] sm:text-4xl">Hei {data?.name || ""} 👋</h1>
        <p className="mt-2 text-sm text-[#607188]">Kohteiden, tarjousten ja laskutuksen tilanne yhdessä paikassa.</p>
      </div>
      <CreateUnifiedRecord />
    </header>

    <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Kohteet" value={String(data?.projectCount ?? 0)} detail={`${data?.activeProjects ?? 0} käynnissä`} tone="green" />
      <StatCard label="Tarjouspyynnöt" value={String(data?.newOffers ?? 0)} detail="Uudet käsiteltävät" tone="green" />
      <StatCard label="Avoin laskutus" value={euro(data?.openInvoiceTotal ?? 0)} detail="Kohteille kohdistetut laskut" />
      <StatCard label="Maksettu" value={euro(data?.paidInvoiceTotal ?? 0)} detail="Seurannassa maksetuksi merkityt" tone="green" />
    </section>

    <section className="mt-8 border border-[#d6dee7] border-t-4 border-t-[#d9ae16] bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#a67a00]">Tarjouskanta</p>
      <h2 className="mt-2 text-xl font-semibold text-[#142b45]">Tarjousten tila</h2>
      <div className="mt-6 space-y-4">
        {stages.map(([label, value, color]) => <div key={label}>
          <div className="mb-2 flex justify-between text-sm"><span className="text-[#253d58]">{label}</span><span className="text-[#607188]">{value}</span></div>
          <div className="h-2 rounded-full bg-[#e6ebf0]"><div className={`h-2 rounded-full ${color}`} style={{ width: `${offersTotal ? Math.max(8, (value / offersTotal) * 100) : 0}%` }} /></div>
        </div>)}
      </div>
    </section>

    <section className="mt-8 border border-[#d6dee7] border-t-4 border-t-[#1f6b56] bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-[.16em] text-[#1f6b56]">Tarjousvahdin ilmoitukset</p><h2 className="mt-2 text-xl font-semibold text-[#142b45]">Sopivat tarjouspyynnöt</h2></div><Link href="/tarjoukset" className="text-sm font-semibold underline">Avaa Tarjousvahti</Link></div>
      {data?.suitableOffers.length ? <div className="mt-5 divide-y divide-[#e4e9ef]">{data.suitableOffers.map((offer) => <Link key={offer.id} href="/tarjoukset" className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0"><div><p className="font-semibold">{offer.title}</p><p className="mt-1 text-sm text-[#607188]">{[offer.serviceType, offer.region].filter(Boolean).join(" · ") || "Täydennä kohdetiedot"} · {offer.recommendation}</p></div><span className="rounded bg-[#e4f4ea] px-3 py-2 text-sm font-semibold text-[#1f6b56]">{offer.fit} % sopivuus</span></Link>)}</div> : <p className="mt-5 text-sm text-[#607188]">Ei vielä AI:n hyvin sopiviksi arvioimia tarjouspyyntöjä. Arvioi kohde Tarjousvahdissa.</p>}
    </section>

    <section className="mt-8 border border-[#d6dee7] border-t-4 border-t-[#d9ae16] bg-white p-6 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#a67a00]">Yhtenäinen työnkulku</p>
      <h2 className="mt-2 text-xl font-semibold text-[#142b45]">Kohde yhdistää työkalut</h2>
      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <Link href="/asiakkaat" className="border border-[#d6dee7] p-4 transition hover:border-[#d9ae16]"><p className="font-semibold">1. Kohde</p><p className="mt-1 text-sm text-[#607188]">Tiedot, vastuuhenkilöt ja laskutuksen seuranta.</p></Link>
        <a href="https://lvi-tarjoustyokalu.netlify.app/?fresh=tb-tarjoustyokalu-cache-cleanup-v1" target="_blank" rel="noreferrer" className="border border-[#d6dee7] p-4 transition hover:border-[#d9ae16]"><p className="font-semibold">2. Tarjoustyökalu ↗</p><p className="mt-1 text-sm text-[#607188]">Laadi tarjous kohteen tiedoilla.</p></a>
        <a href="https://lvi-valvontamuistio-app.netlify.app/" target="_blank" rel="noreferrer" className="border border-[#d6dee7] p-4 transition hover:border-[#d9ae16]"><p className="font-semibold">3. Valvontamuistio ↗</p><p className="mt-1 text-sm text-[#607188]">Tee tarkastukset ja raportit kohteella.</p></a>
      </div>
    </section>
    <section className="mt-8"><Chat /></section>
  </Shell>;
}
