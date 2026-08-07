import { Shell } from "@/components/dashboard/shell";
import { OfferWatch, type WatchedOffer } from "@/components/dashboard/offer-watch";
import { createClient } from "@/lib/supabase/server";

function parseContent(content: string | null) {
  try { return JSON.parse(content ?? "{}"); } catch { return { description: content ?? "" }; }
}

export default async function Offers() {
  const supabase = await createClient();
  const { data } = await supabase.from("offers").select("id,title,source,fit_score,content").order("created_at", { ascending: false });
  const offers: WatchedOffer[] = (data ?? []).filter((offer) => {
    // Hide records created by the initial prototype sync. They contained no
    // notice body and could not be tied to a real Hilma procurement.
    return !(offer.source === "Hilma" && offer.title === "Hilman hankintailmoitus");
  }).map((offer) => {
    const content = parseContent(offer.content);
    return {
      id: offer.id, title: offer.title, source: offer.source, fitScore: offer.fit_score,
      description: content.description || "Kuvausta ei ole lisätty.", region: content.region || "", address: content.address || "", serviceType: content.serviceType || "",
      buyer: content.buyer || "", sourceUrl: content.sourceUrl || "", deadline: content.deadline || "", reasons: Array.isArray(content.reasons) ? content.reasons : [], estimate: content.estimate || "", recommendation: content.recommendation || "Arvioimatta"
    };
  });
  return <Shell><OfferWatch offers={offers} /></Shell>;
}
