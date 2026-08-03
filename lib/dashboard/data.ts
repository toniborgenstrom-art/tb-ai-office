import { createClient } from "@/lib/supabase/server";

export async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const [profileResult, projectsResult, newOffersResult, draftOffersResult, sentOffersResult, documentCountResult, openTasksResult, taskResult, invoicesResult] = await Promise.all([
    supabase.from("users").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("projects").select("id,status").is("archived_at", null),
    supabase.from("offers").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("offers").select("id", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("offers").select("id", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("tasks").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("tasks").select("id,title").eq("status", "open").order("due_at", { ascending: true, nullsFirst: false }).limit(3),
    supabase.from("invoices").select("amount,status"),
  ]);
  const invoices = invoicesResult.data ?? [];
  const openInvoiceTotal = invoices.filter(invoice => ["draft", "sent", "overdue"].includes(invoice.status)).reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const paidInvoiceTotal = invoices.filter(invoice => invoice.status === "paid").reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const projects = projectsResult.data ?? [];
  const name = profileResult.data?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "";
  return { name, projectCount: projects.length, activeProjects: projects.filter(project => project.status === "active").length, newOffers: newOffersResult.count ?? 0, draftOffers: draftOffersResult.count ?? 0, sentOffers: sentOffersResult.count ?? 0, documentCount: documentCountResult.count ?? 0, openTasks: openTasksResult.count ?? 0, openInvoiceTotal, paidInvoiceTotal, tasks: taskResult.data?.map(task => task.title) ?? [] };
}
