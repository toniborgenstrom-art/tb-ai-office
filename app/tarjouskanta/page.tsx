import { Shell } from "@/components/dashboard/shell";
import { OfferRegister, type RegisteredOffer } from "@/components/dashboard/offer-register";
import { createClient } from "@/lib/supabase/server";

export default async function OfferRegisterPage() {
  const supabase = await createClient();
  const { data: projectRows } = await supabase.from("projects").select("id,name,location").is("archived_at", null).order("name");
  const { data } = await supabase.from("offers").select("id,title,offer_number,amount,expires_at,status,source,content,project_id,project:projects(name)").order("created_at", { ascending: false });
  const offers: RegisteredOffer[] = (data ?? []).map((offer) => {
    let content: Record<string, unknown> = {};
    try { content = JSON.parse(offer.content ?? "{}"); } catch { content = { description: offer.content ?? "" }; }
    return { id: offer.id, title: offer.title, offerNumber: offer.offer_number ?? "", amount: offer.amount === null ? null : Number(offer.amount), expiresAt: offer.expires_at ?? "", status: offer.status, source: offer.source ?? "", projectId: offer.project_id ?? "", projectName: offer.project?.[0]?.name ?? "", description: typeof content.description === "string" ? content.description : "", region: typeof content.region === "string" ? content.region : "", sourceUrl: typeof content.sourceUrl === "string" ? content.sourceUrl : "" };
  });
  const projects = (projectRows ?? []).map((project) => ({ id: project.id, name: project.name, location: project.location ?? "" }));
  return <Shell><OfferRegister offers={offers} projects={projects} /></Shell>;
}
