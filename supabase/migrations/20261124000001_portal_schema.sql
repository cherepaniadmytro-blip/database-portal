-- DATABASE Web Intelligence Portal: core schema
create table public.section_access (
  section text primary key,
  label text not null,
  sort_order int not null default 100,
  visible_to text not null default 'owner' check (visible_to in ('public','partner','owner')),
  updated_at timestamptz not null default now()
);

create table public.records (
  id text primary key,
  category text not null references public.section_access(section) on update cascade,
  sheet_category text,
  subcategory text,
  name text not null,
  short_description text,
  details_link text,
  organization text,
  country text,
  city_region text,
  language_community text,
  website text,
  public_contact text,
  source text,
  source_url text,
  published_date text,
  date_added text,
  last_updated text,
  last_verified text,
  status text,
  priority text,
  reliability numeric,
  potential numeric,
  partner_type text,
  next_action text,
  responsible_agent text,
  access_level text not null default 'PRIVATE' check (access_level in ('PUBLIC','PARTNER','PRIVATE')),
  pay_budget text,
  requirements text,
  hours_format text,
  skill_fit numeric,
  notes text,
  duplicate_check text,
  sheet_row int,
  synced_at timestamptz not null default now()
);
create index records_category_idx on public.records(category);
create index records_access_idx on public.records(access_level);
create index records_status_idx on public.records(status);
create index records_last_updated_idx on public.records(last_updated desc);

create table public.update_history (
  id bigserial primary key,
  changed_at text not null,
  record_id text,
  section text,
  change_type text,
  previous_value text,
  new_value text,
  source text,
  agent text,
  reason text,
  sheet_row int unique
);
create index update_history_record_idx on public.update_history(record_id);
create index update_history_changed_idx on public.update_history(changed_at desc);

create table public.daily_reports (
  id bigserial primary key,
  report_date date not null,
  report_type text not null default 'daily' check (report_type in ('daily','weekly','monthly')),
  title text not null,
  doc_url text,
  summary text,
  visible_to text not null default 'owner' check (visible_to in ('public','partner','owner')),
  created_at timestamptz not null default now(),
  unique (report_date, report_type)
);

create table public.sync_status (
  source text primary key,
  last_attempt_at timestamptz,
  last_success_at timestamptz,
  status text not null default 'never' check (status in ('ok','error','running','never')),
  records_synced int,
  error text,
  details jsonb
);

create table public.invited_emails (
  email text primary key check (email = lower(email)),
  role text not null default 'partner' check (role in ('owner','partner')),
  invited_at timestamptz not null default now(),
  note text
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'partner' check (role in ('owner','partner')),
  created_at timestamptz not null default now()
);
