import { Shell } from "@/components/dashboard/shell";
import { OfferRegister, type RegisteredOffer } from "@/components/dashboard/offer-register";
import { createClient } from "@/lib/supabase/server";

export default async function OfferRegisterPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("offers").select("id,title,offer_number,amount,expires_at,status,source,project:projects(name)").order("created_at", { ascending: false });
  const offers: RegisteredOffer[] = (data ?? []).map((offer) => ({ id: offer.id, title: offer.title, offerNumber: offer.offer_number ?? "", amount: offer.amount === null ? null : Number(offer.amount), expiresAt: offer.expires_at ?? "", status: offer.status, source: offer.source ?? "", projectName: offer.project?.[0]?.name ?? "" }));
  return <Shell><OfferRegister offers={offers} /></Shell>;
}
