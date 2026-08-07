create table if not exists public.document_ai_reviews (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  document_id uuid not null unique references public.documents(id) on delete cascade,
  source_text text not null default '',
  summary text,
  draft text,
  actions jsonb not null default '[]'::jsonb,
  status text not null default 'pending' check (status in ('pending','ready','reviewed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.document_ai_reviews enable row level security;

drop policy if exists "members manage document AI reviews" on public.document_ai_reviews;
create policy "members manage document AI reviews"
on public.document_ai_reviews for all to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));
