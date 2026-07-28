create extension if not exists "pgcrypto";

create table companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid references companies(id) on delete set null,
  full_name text,
  role text not null default 'member',
  created_at timestamptz not null default now()
);

create table customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  name text not null,
  location text,
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table offers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  customer_id uuid references customers(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  source text,
  fit_score integer check (fit_score between 0 and 100),
  status text not null default 'new',
  content text,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  name text not null,
  storage_path text not null,
  mime_type text,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  status text not null default 'open',
  due_at timestamptz,
  created_at timestamptz not null default now()
);

create table ai_messages (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid references users(id) on delete set null,
  role text not null check (role in ('user', 'assistant', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  title text not null,
  body text,
  channel text not null default 'in_app',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

alter table companies enable row level security;
alter table users enable row level security;
alter table customers enable row level security;
alter table projects enable row level security;
alter table offers enable row level security;
alter table documents enable row level security;
alter table tasks enable row level security;
alter table ai_messages enable row level security;
alter table notifications enable row level security;

-- Add company-scoped policies after the first Supabase user and company bootstrap flow is implemented.
