type Source = {
  name: string;
  status: string;
  description: string;
  action?: { href: string; label: string };
};

const sources: Source[] = [
  { name: "Hilma", status: "Käytössä · automaattinen haku kerran päivässä", description: "Julkisten hankintojen virallinen lähde. Vain asetuksiin sopivat, avoimet ilmoitukset tallennetaan Tarjousvahtiin." },
  { name: "Cloudia / Tarjouspalvelu", status: "Odottaa rajapintaoikeutta", description: "Tarjouspalvelun avoimia julkaisuja voidaan seurata selaimella jo nyt. Automaattinen haku otetaan käyttöön vasta Cloudian hyväksymällä lukuoikeudella.", action: { href: "https://supplierportal.cloudia.net/Default/Index", label: "Avaa Tarjouspalvelu" } },
  { name: "Mercell", status: "Odottaa sopimusta tai rajapintaa", description: "Mercellin tarjouskanta voidaan liittää samaan suodatukseen, kun käyttöoikeus ja tekninen rajapinta on sovittu.", action: { href: "https://info.mercell.com/fi-fi/julkiset-hankinnat/", label: "Tutustu Mercelliin" } },
];

export function OfferSources() {
  return <section className="mt-8 max-w-3xl border border-[#d6dee7] border-t-4 border-t-[#142b45] bg-white p-6 shadow-sm">
    <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#1f6b56]">Tarjouslähteet</p>
    <h2 className="mt-2 text-xl font-semibold text-[#142b45]">Lähteiden tila</h2>
    <p className="mt-2 text-sm text-[#607188]">Kaikki käyttöönotetut lähteet käyttävät samoja palvelu-, alue- ja sopivuusrajoja.</p>
    <div className="mt-5 divide-y divide-[#e1e7ed] border-y border-[#e1e7ed]">
      {sources.map((source) => <div key={source.name} className="flex flex-wrap items-start justify-between gap-4 py-4">
        <div className="max-w-xl"><h3 className="font-semibold text-[#142b45]">{source.name}</h3><p className="mt-1 text-sm font-medium text-[#1f6b56]">{source.status}</p><p className="mt-2 text-sm text-[#607188]">{source.description}</p></div>
        {source.action && <a href={source.action.href} target="_blank" rel="noreferrer" className="shrink-0 rounded border border-[#142b45] px-3 py-2 text-sm font-semibold text-[#142b45]">{source.action.label} ↗</a>}
      </div>)}
    </div>
  </section>;
}
