import { Shell } from "@/components/dashboard/shell";
import { InvoiceForm } from "@/components/dashboard/invoice-form";
import { InvoiceProject } from "@/components/dashboard/invoice-project";
import { InvoiceStatus } from "@/components/dashboard/invoice-status";
import { createClient } from "@/lib/supabase/server";

type Invoice = {
  id: string;
  invoice_number: string;
  amount: number;
  status: string;
  due_date: string | null;
  project_id: string | null;
};
type Project = { id: string; name: string; customer_id: string | null };
type Customer = { id: string; name: string };
type Target = { id: string; name: string };

export default async function BillingPage() {
  const supabase = await createClient();
  const [{ data: invoices }, projectsWithArchive, customersWithArchive] = await Promise.all([
    supabase.from("invoices").select("id,invoice_number,amount,status,due_date,project_id").order("created_at", { ascending: false }),
    supabase.from("projects").select("id,name,customer_id").is("archived_at", null).order("name"),
    supabase.from("customers").select("id,name").is("archived_at", null).order("name"),
  ]);

  // Older installations may not yet have the optional archive column on both
  // tables. Do not let that schema difference hide every selectable target.
  const [projectsWithoutArchive, customersWithoutArchive] = await Promise.all([
    projectsWithArchive.error ? supabase.from("projects").select("id,name,customer_id").order("name") : Promise.resolve(null),
    customersWithArchive.error ? supabase.from("customers").select("id,name").order("name") : Promise.resolve(null),
  ]);

  const rows = (invoices ?? []) as Invoice[];
  const projects = (projectsWithArchive.data ?? projectsWithoutArchive?.data ?? []) as Project[];
  const customers = (customersWithArchive.data ?? customersWithoutArchive?.data ?? []) as Customer[];
  const projectCustomerIds = new Set(projects.map((project) => project.customer_id).filter(Boolean));
  // A previously saved customer can be selected directly. The API creates its
  // invisible technical project only once, when a bill needs an association.
  const targets: Target[] = [
    ...projects.map((project) => ({ id: project.id, name: project.name })),
    ...customers
      .filter((customer) => !projectCustomerIds.has(customer.id))
      .map((customer) => ({ id: `customer:${customer.id}`, name: customer.name })),
  ];
  const open = rows
    .filter((invoice) => ["draft", "sent", "overdue"].includes(invoice.status))
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const overdue = rows
    .filter((invoice) => invoice.status === "overdue")
    .reduce((sum, invoice) => sum + Number(invoice.amount), 0);
  const targetNames = new Map(targets.map((target) => [target.id, target.name]));
  const unassigned = rows.filter((invoice) => !invoice.project_id).length;

  return (
    <Shell>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[.16em] text-[#a67a00]">Laskutuksen seuranta</p>
          <h1 className="mt-2 text-3xl font-semibold">Myyntilaskut</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#607188]">Kirjanpitäjän laskujen seuranta. Jokainen lasku kohdistetaan tietylle kohteelle, jolloin kohteen kannattavuus ja maksutilanne pysyvät ajan tasalla.</p>
        </div>
        <InvoiceForm projects={targets} />
      </div>

      {unassigned > 0 && <p className="mt-6 border border-red-300 bg-red-50 p-4 text-sm text-red-900"><b>{unassigned} kohdistamatonta laskua.</b> Valitse niille kohde alla olevasta valikosta.</p>}

      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="border border-[#d6dee7] border-t-4 border-t-[#d9ae16] bg-white p-5">
          <p className="text-xs font-semibold uppercase text-[#607188]">Avoin seuranta</p>
          <p className="mt-2 text-3xl font-semibold">{open.toLocaleString("fi-FI", { style: "currency", currency: "EUR" })}</p>
          <p className="mt-1 text-xs text-[#607188]">Tallennetut ja laskutetut kohdekohtaiset laskut</p>
        </div>
        <div className="border border-[#d6dee7] border-t-4 border-t-red-600 bg-white p-5">
          <p className="text-xs font-semibold uppercase text-[#607188]">Myöhässä</p>
          <p className="mt-2 text-3xl font-semibold">{overdue.toLocaleString("fi-FI", { style: "currency", currency: "EUR" })}</p>
          <p className="mt-1 text-xs text-[#607188]">Merkitse tila itse tarvittaessa</p>
        </div>
      </section>

      <div className="mt-8 overflow-hidden border border-[#d6dee7] bg-white">
        <div className="grid grid-cols-[.8fr_1.25fr_.6fr_.6fr_auto] gap-4 border-b bg-[#f4f7fa] px-5 py-3 text-xs font-semibold uppercase text-[#607188]">
          <span>Lasku</span><span>Kohde</span><span>Eräpäivä</span><span>Summa</span><span>Tila</span>
        </div>
        {rows.length ? rows.map((invoice) => (
          <div key={invoice.id} className="grid grid-cols-[.8fr_1.25fr_.6fr_.6fr_auto] gap-4 border-b border-[#e4e9ef] px-5 py-4 text-sm">
            <b>{invoice.invoice_number}</b>
            <InvoiceProject invoiceId={invoice.id} projectId={invoice.project_id} projectName={invoice.project_id ? targetNames.get(invoice.project_id) : undefined} projects={targets} />
            <span>{invoice.due_date ?? "—"}</span>
            <span>{Number(invoice.amount).toLocaleString("fi-FI", { style: "currency", currency: "EUR" })}</span>
            <InvoiceStatus id={invoice.id} status={invoice.status} />
          </div>
        )) : <p className="p-6 text-sm text-[#607188]">Ei vielä tallennettuja laskuja.</p>}
      </div>
    </Shell>
  );
}
