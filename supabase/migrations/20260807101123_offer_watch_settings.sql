create table if not exists public.offer_watch_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  service_keywords text[] not null default array[
    'LVI-valvonta', 'KVV-työnjohtaja', 'IV-työnjohtaja',
    'rakennuttajakonsultti', 'talotekniikka', 'valvoja',
    'kuntotutkimus', 'sisäilma', 'korjaussuunnittelu'
  ],
  regions text[] not null default array['Uusimaa', 'Kanta-Häme', 'Päijät-Häme', 'Pirkanmaa'],
  min_fit_score integer not null default 55 check (min_fit_score between 0 and 100),
  notification_email text,
  email_notifications_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.offer_watch_settings enable row level security;

create policy "members manage offer watch settings"
on public.offer_watch_settings
for all
to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));
