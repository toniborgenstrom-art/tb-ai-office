alter table public.customers
  add column if not exists customer_type text not null default 'Muu';
