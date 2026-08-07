create table if not exists public.project_inspections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  inspection_date date not null,
  inspection_type text not null default 'general',
  title text not null,
  notes text,
  status text not null default 'planned' check (status in ('planned', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists project_inspections_project_date_idx
  on public.project_inspections (project_id, inspection_date);

alter table public.project_inspections enable row level security;

drop policy if exists "members manage project inspections" on public.project_inspections;
create policy "members manage project inspections"
  on public.project_inspections
  for all
  to authenticated
  using (is_company_member(company_id))
  with check (is_company_member(company_id));

grant select, insert, update, delete on public.project_inspections to authenticated;
