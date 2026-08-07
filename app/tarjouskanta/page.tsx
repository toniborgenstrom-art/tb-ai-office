import { Shell } from "@/components/dashboard/shell";
import { OfferRegister, type RegisteredOffer } from "@/components/dashboard/offer-register";
import { createClient } from "@/lib/supabase/server";

function parseContent(content: string | null) {
  try { return JSON.parse(content ?? "{}"); } catch { return {}; }
}

export default async function OfferRegisterPage() {
  const supabase = await createClient();
  const { data: projectRows } = await supabase.from("projects").select("id,name,location").is("archived_at", null).order("name");
  const { data } = await supabase.from("offers").select("id,title,offer_number,amount,expires_at,status,source,content,project_id,project:projects(name)").order("created_at", { ascending: false });
  const offers: RegisteredOffer[] = (data ?? []).filter((offer) => {
    if (offer.source !== "Hilma") return true;
    if (offer.title === "Hilman hankintailmoitus") return false;
    const content = parseContent(offer.content);
    const language = String(content.hilmaNotice?.language ?? "").toUpperCase();
    const deadline = String(content.deadline ?? "").match(/\d{4}-\d{2}-\d{2}/)?.[0];
    return language === "FI" && Boolean(deadline) && new Date(`${deadline}T23:59:59.999Z`) >= new Date();
  }).map((offer) => {
    let content: Record<string, unknown> = {};
    try { content = JSON.parse(offer.content ?? "{}"); } catch { content = { description: offer.content ?? "" }; }
    return { id: offer.id, title: offer.title, offerNumber: offer.offer_number ?? "", amount: offer.amount === null ? null : Number(offer.amount), expiresAt: offer.expires_at ?? "", status: offer.status, source: offer.source ?? "", projectId: offer.project_id ?? "", projectName: offer.project?.[0]?.name ?? "", description: typeof content.description === "string" ? content.description : "", region: typeof content.region === "string" ? content.region : "", sourceUrl: typeof content.sourceUrl === "string" ? content.sourceUrl : "" };
  });
  const projects = (projectRows ?? []).map((project) => ({ id: project.id, name: project.name, location: project.location ?? "" }));
  return <Shell><OfferRegister offers={offers} projects={projects} /></Shell>;
}
