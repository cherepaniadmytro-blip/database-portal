-- Extend record_workflow statuses to:
-- new -> started -> reviewed -> contacted -> replied -> working | declined
-- and add quick marks array column (joined_group, letter_sent, called, in_telegram).

alter table public.record_workflow
  drop constraint if exists record_workflow_status_check;

update public.record_workflow
set status = case status
  when 'selected' then 'started'
  when 'draft_ready' then 'reviewed'
  when 'agreed' then 'working'
  else status
end
where status in ('selected', 'draft_ready', 'agreed');

alter table public.record_workflow
  add constraint record_workflow_status_check
  check (status in ('new', 'started', 'reviewed', 'contacted', 'replied', 'working', 'declined'));

alter table public.record_workflow
  add column if not exists marks text[] not null default '{}'::text[];

alter table public.record_workflow
  drop constraint if exists record_workflow_marks_check;

alter table public.record_workflow
  add constraint record_workflow_marks_check
  check (marks <@ array['joined_group', 'letter_sent', 'called', 'in_telegram']::text[]);

create index if not exists record_workflow_assigned_idx on public.record_workflow(assigned_to) where assigned_to is not null;
create index if not exists record_workflow_status_idx on public.record_workflow(status);

create or replace function private.stamp_workflow() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_email text := (select p.email from public.profiles p where p.id = auth.uid());
begin
  new.updated_by := auth.uid();
  new.updated_by_email := v_email;
  new.updated_at := now();
  if (new.status in ('contacted', 'replied', 'working') or 'letter_sent' = any(new.marks)) and new.contacted_at is null then
    new.contacted_at := now();
  end if;
  if tg_op = 'INSERT' then
    insert into public.workflow_events(record_id, actor_id, actor_email, event, old_value, new_value)
    values (new.record_id, auth.uid(), v_email, 'created', null, concat_ws(' | ', new.relation_type, new.status));
    if new.assigned_to is not null then
      insert into public.workflow_events(record_id, actor_id, actor_email, event, old_value, new_value)
      values (new.record_id, auth.uid(), v_email, 'assigned_to', null, (select p.email from public.profiles p where p.id = new.assigned_to));
    end if;
    if cardinality(new.marks) > 0 then
      insert into public.workflow_events(record_id, actor_id, actor_email, event, old_value, new_value)
      values (new.record_id, auth.uid(), v_email, 'marks', null, array_to_string(new.marks, ','));
    end if;
  else
    if new.status is distinct from old.status then
      insert into public.workflow_events(record_id, actor_id, actor_email, event, old_value, new_value)
      values (new.record_id, auth.uid(), v_email, 'status', old.status, new.status);
    end if;
    if new.relation_type is distinct from old.relation_type then
      insert into public.workflow_events(record_id, actor_id, actor_email, event, old_value, new_value)
      values (new.record_id, auth.uid(), v_email, 'relation_type', old.relation_type, new.relation_type);
    end if;
    if new.assigned_to is distinct from old.assigned_to then
      insert into public.workflow_events(record_id, actor_id, actor_email, event, old_value, new_value)
      values (new.record_id, auth.uid(), v_email, 'assigned_to',
        (select p.email from public.profiles p where p.id = old.assigned_to),
        (select p.email from public.profiles p where p.id = new.assigned_to));
    end if;
    if new.marks is distinct from old.marks then
      insert into public.workflow_events(record_id, actor_id, actor_email, event, old_value, new_value)
      values (new.record_id, auth.uid(), v_email, 'marks',
        nullif(array_to_string(old.marks, ','), ''),
        nullif(array_to_string(new.marks, ','), ''));
    end if;
    if new.next_step is distinct from old.next_step then
      insert into public.workflow_events(record_id, actor_id, actor_email, event, old_value, new_value)
      values (new.record_id, auth.uid(), v_email, 'next_step', old.next_step, new.next_step);
    end if;
  end if;
  return new;
end $$;
