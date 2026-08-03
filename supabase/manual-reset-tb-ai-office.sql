-- ONE-TIME RESET: Removes only TB AI Office workspace data for tbvalvonta@gmail.com.
-- Keeps the Supabase account, login, company and application configuration intact.
do $$
declare
  target_company uuid;
begin
  select u.company_id into target_company
  from public.users u
  join auth.users au on au.id = u.id
  where lower(au.email) = 'tbvalvonta@gmail.com'
  limit 1;

  if target_company is null then
    raise exception 'TB AI Office company was not found for tbvalvonta@gmail.com';
  end if;

  delete from public.invoices where company_id = target_company;
  delete from public.notifications where company_id = target_company;
  delete from public.ai_messages where company_id = target_company;
  delete from public.documents where company_id = target_company;
  delete from public.offers where company_id = target_company;
  delete from public.tasks where company_id = target_company;
  delete from public.projects where company_id = target_company;
  delete from public.customers where company_id = target_company;
end $$;
