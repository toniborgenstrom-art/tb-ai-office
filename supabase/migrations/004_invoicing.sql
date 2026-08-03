alter table public.offers add column if not exists offer_number text;
alter table public.offers add column if not exists amount numeric(12,2);
alter table public.offers add column if not exists expires_at date;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  project_id uuid references public.projects(id) on delete set null,
  offer_id uuid references public.offers(id) on delete set null,
  invoice_number text not null,
  amount numeric(12,2) not null check (amount >= 0),
  status text not null default 'draft' check (status in ('draft','sent','paid','overdue','cancelled')),
  due_date date,
  sent_at timestamptz,
  paid_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.invoices enable row level security;
drop policy if exists "members manage invoices" on public.invoices;
create policy "members manage invoices" on public.invoices for all using (is_company_member(company_id)) with check (is_company_member(company_id));
