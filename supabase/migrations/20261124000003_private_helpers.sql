create schema if not exists private;
grant usage on schema private to anon, authenticated;
alter function public.can_see(text, text) set schema private;
alter function public.enforce_invite_only() set schema private;
alter function public.handle_new_user() set schema private;
comment on function public.app_role() is 'Returns caller role: owner | partner | public | none. Intentionally callable by clients.';
comment on function public.last_sync() is 'Public-safe last sync info for the portal dashboard. Intentionally callable by anon.';
