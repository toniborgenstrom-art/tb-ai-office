import { createClient } from "@/lib/supabase/server";

export async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const [profileResult, newOffersResult, activeProjectsResult, documentCountResult, customerCountResult, openTasksResult, draftOffersResult, sentOffersResult, taskResult] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("offers").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("projects").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("offers").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("offers").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("tasks").select("id,title").eq("status", "open").order("due_at", { ascending: true, nullsFirst: false }).limit(3)
  ]);

  const name = profileResult.data?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "";
  const tasks = taskResult.data?.map(task => task.title) ?? [];
  return {
    name,
    newOffers: newOffersResult.count ?? 0,
    activeProjects: activeProjectsResult.count ?? 0,
    documentCount: documentCountResult.count ?? 0,
    customerCount: customerCountResult.count ?? 0,
    openTasks: openTasksResult.count ?? 0,
    draftOffers: draftOffersResult.count ?? 0,
    sentOffers: sentOffersResult.count ?? 0,
    tasks
  };
}
