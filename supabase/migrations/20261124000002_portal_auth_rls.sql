-- Role helpers (security definer so policies can read profiles without recursion)
create or replace function public.app_role() returns text
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.role from public.profiles p where p.id = auth.uid()),
                  case when auth.uid() is null then 'public' else 'none' end)
$$;
create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'owner')
$$;
create or replace function public.can_see(p_section text, p_access text) returns boolean
language sql stable security definer set search_path = '' as $$
  select case
    when public.is_owner() then true
    when public.app_role() = 'partner' then
      p_access in ('PUBLIC','PARTNER') and exists (select 1 from public.section_access s where s.section = p_section and s.visible_to in ('public','partner'))
    else
      p_access = 'PUBLIC' and exists (select 1 from public.section_access s where s.section = p_section and s.visible_to = 'public')
  end
$$;

-- Invite-only sign-up: reject auth users whose email is not invited
create or replace function public.enforce_invite_only() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.email is null or not exists (select 1 from public.invited_emails i where i.email = lower(new.email)) then
    raise exception 'Sign-up is invite-only';
  end if;
  return new;
end $$;
create trigger enforce_invite_only before insert on auth.users
  for each row execute function public.enforce_invite_only();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, role)
  select new.id, lower(new.email), coalesce((select i.role from public.invited_emails i where i.email = lower(new.email)), 'partner')
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Public-safe sync info
create or replace function public.last_sync() returns table(source text, last_success_at timestamptz, status text, records_synced int)
language sql stable security definer set search_path = '' as $$
  select s.source, s.last_success_at, s.status, s.records_synced from public.sync_status s
$$;

revoke execute on function public.enforce_invite_only() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

alter table public.section_access enable row level security;
alter table public.records enable row level security;
alter table public.update_history enable row level security;
alter table public.daily_reports enable row level security;
alter table public.sync_status enable row level security;
alter table public.invited_emails enable row level security;
alter table public.profiles enable row level security;

-- section_access: everyone reads (nav), owner edits
create policy section_access_read on public.section_access for select to anon, authenticated using (true);
create policy section_access_owner_write on public.section_access for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- records
create policy records_read on public.records for select to anon, authenticated using (public.can_see(category, access_level));
create policy records_owner_write on public.records for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- update_history: owner all; others only for records they can see
create policy update_history_read on public.update_history for select to anon, authenticated
  using (public.is_owner() or exists (select 1 from public.records r where r.id = update_history.record_id));
create policy update_history_owner_write on public.update_history for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- daily_reports
create policy daily_reports_read on public.daily_reports for select to anon, authenticated
  using (public.is_owner() or visible_to = 'public' or (visible_to = 'partner' and public.app_role() = 'partner'));
create policy daily_reports_owner_write on public.daily_reports for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- sync_status: owner only (public gets last_sync())
create policy sync_status_owner on public.sync_status for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- invited_emails: owner manages invitations
create policy invited_emails_owner on public.invited_emails for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- profiles: self read; owner manages
create policy profiles_self_read on public.profiles for select to authenticated using (id = auth.uid() or public.is_owner());
create policy profiles_owner_update on public.profiles for update to authenticated using (public.is_owner()) with check (public.is_owner());
create policy profiles_owner_delete on public.profiles for delete to authenticated using (public.is_owner());

-- Seed sections (defaults mirror Master Database Access Levels; owner can change)
insert into public.section_access(section,label,sort_order,visible_to) values
 ('FinanzHelper','FinanzHelper',1,'owner'),
 ('Leads','Потенційні клієнти та ліди',2,'owner'),
 ('Partners','Партнери та співпраця',3,'owner'),
 ('Jobs & Freelance','Робота та фриланс',4,'owner'),
 ('Companies','Компанії та організації',5,'partner'),
 ('AI Agents & Automation','AI-агенти та автоматизація',6,'owner'),
 ('Business Opportunities','Бізнес-можливості',7,'owner'),
 ('Market Research','Дослідження ринку',8,'public'),
 ('Marketing','Маркетинг та реклама',9,'partner'),
 ('Contacts','Контакти',10,'owner'),
 ('Competitors','Конкуренти',11,'owner'),
 ('Projects & Ideas','Стартапи та нові ідеї',12,'owner'),
 ('Tools & Tech','Технології та інструменти',13,'partner'),
 ('Financial Opportunities','Фінансові можливості',14,'owner'),
 ('Knowledge Base','База знань',15,'owner'),
 ('Sources','Джерела',16,'owner');

-- Owner invitation is seeded directly in the database (not committed, to keep emails out of the public repo):
-- insert into public.invited_emails(email, role, note) values ('<owner email>','owner','owner');
