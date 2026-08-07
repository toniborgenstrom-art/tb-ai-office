import { OfferSources } from "@/components/dashboard/offer-sources";
import { OfferWatchSettingsForm } from "@/components/dashboard/offer-watch-settings";
import { Shell } from "@/components/dashboard/shell";
import { defaultOfferWatchSettings, toOfferWatchSettings } from "@/lib/offer-watch-settings";
import { getCurrentWorkspace } from "@/lib/supabase/current-user";

export default async function SettingsPage() {
  const { supabase, companyId } = await getCurrentWorkspace();
  const result = companyId
    ? await supabase.from("offer_watch_settings").select("*").eq("company_id", companyId).maybeSingle()
    : { data: null, error: null };
  const schemaPending = Boolean(result.error);

  return <Shell>
    <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#a67a00]">Tarjousvahti</p>
    <h1 className="mt-2 text-3xl font-semibold">Tarjousvahdin asetukset</h1>
    <p className="mt-2 max-w-3xl text-sm text-[#607188]">Rajaa automaattinen Hilma-haku palveluihin ja alueisiin, joilla haluat tehdä työtä. Vain aidosti avoimet, suomenkieliset ja vähimmäispisteet ylittävät kohteet tallennetaan.</p>
    {schemaPending && <p className="mt-5 border border-[#d9ae16] bg-[#fff9e5] p-3 text-sm text-[#735400]">Asetusten tallennus avautuu heti, kun Supabase-muutos on suoritettu.</p>}
    <OfferWatchSettingsForm initial={result.data ? toOfferWatchSettings(result.data) : defaultOfferWatchSettings} />
    <OfferSources />
  </Shell>;
}
