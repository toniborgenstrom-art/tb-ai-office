"use client";

import { DEFAULT_REGIONS, DEFAULT_SERVICE_KEYWORDS, type OfferWatchSettings } from "@/lib/offer-watch-settings";
import { useState } from "react";

function ToggleList({ values, selected, onChange }: { values: readonly string[]; selected: string[]; onChange: (next: string[]) => void }) {
  return <div className="mt-2 grid gap-2 sm:grid-cols-2">{values.map((value) => <label key={value} className="flex items-center gap-2 rounded border border-[#d6dee7] bg-white px-3 py-2 text-sm"><input type="checkbox" checked={selected.includes(value)} onChange={(event) => onChange(event.target.checked ? [...selected, value] : selected.filter((item) => item !== value))} />{value}</label>)}</div>;
}

export function OfferWatchSettingsForm({ initial }: { initial: OfferWatchSettings }) {
  const [settings, setSettings] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  async function save(event: React.FormEvent) {
    event.preventDefault(); setSaving(true); setMessage("");
    const response = await fetch("/api/offer-watch-settings", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(settings) });
    const data = await response.json();
    setMessage(response.ok ? "Asetukset tallennettu. Seuraava Hilma-haku käyttää näitä rajauksia." : (data.error || "Tallennus epäonnistui."));
    setSaving(false);
  }
  return <form onSubmit={save} className="mt-8 max-w-3xl border border-[#d6dee7] border-t-4 border-t-[#d9ae16] bg-white p-6 shadow-sm"><section><h2 className="text-lg font-semibold">Palvelut</h2><p className="mt-1 text-sm text-[#607188]">Tarjousvahti tuo vain ilmoitukset, joissa jokin valituista palveluista löytyy.</p><ToggleList values={DEFAULT_SERVICE_KEYWORDS} selected={settings.serviceKeywords} onChange={(serviceKeywords) => setSettings({ ...settings, serviceKeywords })} /></section><section className="mt-7 border-t border-[#e1e7ed] pt-6"><h2 className="text-lg font-semibold">Toiminta-alueet</h2><ToggleList values={DEFAULT_REGIONS} selected={settings.regions} onChange={(regions) => setSettings({ ...settings, regions })} /></section><section className="mt-7 border-t border-[#e1e7ed] pt-6"><label className="block max-w-sm text-sm font-medium">Vähimmäissopivuus<input type="number" min="0" max="100" value={settings.minFitScore} onChange={(event) => setSettings({ ...settings, minFitScore: Number(event.target.value) })} className="mt-2 w-full border border-[#cfd8e2] px-3 py-2" /><span className="mt-1 block text-xs text-[#607188]">Vain tämän pistemäärän saavuttavat ilmoitukset tallennetaan.</span></label></section><section className="mt-7 border-t border-[#e1e7ed] pt-6"><h2 className="text-lg font-semibold">Ilmoitus</h2><label className="mt-3 block max-w-lg text-sm font-medium">Sähköposti<input type="email" value={settings.notificationEmail} onChange={(event) => setSettings({ ...settings, notificationEmail: event.target.value })} placeholder="tbvalvonta@gmail.com" className="mt-2 w-full border border-[#cfd8e2] px-3 py-2" /></label><label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" checked={settings.emailNotificationsEnabled} onChange={(event) => setSettings({ ...settings, emailNotificationsEnabled: event.target.checked })} />Lähetä sähköposti, kun uusi sopiva kohde löytyy</label><p className="mt-2 text-xs text-[#607188]">Työtilan ilmoitus tallennetaan aina. Sähköposti aktivoituu, kun palvelinympäristöön on lisätty lähettäjän sähköpostipalvelun avain.</p></section>{message && <p className="mt-5 rounded border border-[#d6dee7] bg-[#eef3f7] p-3 text-sm text-[#253d58]">{message}</p>}<button disabled={saving} className="mt-6 rounded bg-[#d9ae16] px-4 py-3 text-sm font-semibold text-[#142b45] disabled:opacity-50">{saving ? "Tallennetaan…" : "Tallenna asetukset"}</button></form>;
}
