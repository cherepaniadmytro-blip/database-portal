-- Add display_name to profiles so every team member sees readable names ("Працює: Samuel") instead of raw emails.
alter table public.profiles
  add column if not exists display_name text;

alter table public.profiles
  drop constraint if exists profiles_display_name_len;

alter table public.profiles
  add constraint profiles_display_name_len
  check (display_name is null or char_length(btrim(display_name)) between 1 and 80);

-- Update team_members() RPC to expose display_name to signed-in team members.
drop function if exists public.team_members();

create function public.team_members()
returns table(id uuid, email text, role text, display_name text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.email, p.role, p.display_name
  from public.profiles p
  where private.is_team()
    and p.role in ('owner', 'partner')
  order by p.role desc, coalesce(nullif(btrim(p.display_name), ''), p.email)
$$;

revoke all on function public.team_members() from public, anon;
grant execute on function public.team_members() to authenticated;

-- Dedicated RPC so partners can edit ONLY their own display_name (never role),
-- and owners can edit any team member's display_name.
create or replace function public.update_display_name(p_name text, p_user_id uuid default null)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_target uuid := coalesce(p_user_id, auth.uid());
  v_clean text := nullif(btrim(coalesce(p_name, '')), '');
begin
  if not private.is_team() then
    raise exception 'Not authorized';
  end if;
  if v_target is null then
    raise exception 'Missing target user';
  end if;
  if v_target <> auth.uid() and not public.is_owner() then
    raise exception 'Only owner can rename other team members';
  end if;
  if v_clean is not null and char_length(v_clean) > 80 then
    raise exception 'Display name too long (max 80 chars)';
  end if;

  update public.profiles
     set display_name = v_clean
   where id = v_target;

  return v_clean;
end $$;

revoke all on function public.update_display_name(text, uuid) from public, anon;
grant execute on function public.update_display_name(text, uuid) to authenticated;
