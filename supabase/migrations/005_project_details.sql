alter table public.projects
  add column if not exists project_details jsonb not null default '{}'::jsonb;
