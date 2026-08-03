import { Shell } from "@/components/dashboard/shell";
import { OfferWatch, type WatchedOffer } from "@/components/dashboard/offer-watch";
import { createClient } from "@/lib/supabase/server";

function parseContent(content: string | null) {
  try { return JSON.parse(content ?? "{}"); } catch { return { description: content ?? "" }; }
}

export default async function Offers() {
  const supabase = await createClient();
  const { data } = await supabase.from("offers").select("id,title,source,fit_score,content").order("created_at", { ascending: false });
  const offers: WatchedOffer[] = (data ?? []).map((offer) => {
    const content = parseContent(offer.content);
    return { id: offer.id, title: offer.title, source: offer.source, fitScore: offer.fit_score, description: content.description || "Kuvausta ei ole lisätty.", region: content.region || "", sourceUrl: content.sourceUrl || "", deadline: content.deadline || "", reasons: Array.isArray(content.reasons) ? content.reasons : [], estimate: content.estimate || "", recommendation: content.recommendation || "Arvioimatta" };
  });
  return <Shell><OfferWatch offers={offers} /></Shell>;
}
