alter table public.customers add column if not exists archived_at timestamptz;
alter table public.projects add column if not exists archived_at timestamptz;
