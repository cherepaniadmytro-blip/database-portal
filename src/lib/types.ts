export type Role = 'owner' | 'partner' | 'public' | 'none'

export type Visibility = 'public' | 'partner' | 'owner'

export type RecordRow = {
  id: string
  category: string
  sheet_category: string | null
  subcategory: string | null
  name: string
  short_description: string | null
  details_link: string | null
  organization: string | null
  country: string | null
  city_region: string | null
  language_community: string | null
  website: string | null
  public_contact: string | null
  source: string | null
  source_url: string | null
  published_date: string | null
  date_added: string | null
  last_updated: string | null
  last_verified: string | null
  status: string | null
  priority: string | null
  reliability: number | null
  potential: number | null
  partner_type: string | null
  next_action: string | null
  responsible_agent: string | null
  access_level: string
  pay_budget: string | null
  requirements: string | null
  hours_format: string | null
  skill_fit: number | null
  notes: string | null
  duplicate_check: string | null
  sheet_row: number | null
  synced_at: string
}

export type SectionRow = {
  section: string
  label: string
  sort_order: number
  visible_to: Visibility
  updated_at: string
}

export type HistoryRow = {
  id: number
  changed_at: string
  record_id: string | null
  section: string | null
  change_type: string | null
  previous_value: string | null
  new_value: string | null
  source: string | null
  agent: string | null
  reason: string | null
  sheet_row: number | null
}

export type ReportRow = {
  id: number
  report_date: string
  report_type: string
  title: string
  doc_url: string | null
  summary: string | null
  visible_to: Visibility | string
  created_at: string
}

export type SyncRow = {
  source: string
  last_success_at: string | null
  status: string | null
  records_synced: number | null
}

export type SyncStatusRow = SyncRow & {
  last_attempt_at: string | null
  error: string | null
  details: unknown
}

export type InviteRow = {
  email: string
  role: 'owner' | 'partner'
  invited_at: string
  note: string | null
}

export type DateField = 'date_added' | 'last_updated' | 'last_verified'

export type FilterState = {
  q: string
  status: string
  priority: string
  country: string
  category: string
  dateField: DateField
  dateFrom: string
  dateTo: string
}

export type SortKey =
  | 'name'
  | 'category'
  | 'subcategory'
  | 'country'
  | 'status'
  | 'priority'
  | 'potential'
  | 'date_added'
  | 'last_updated'
  | 'score'

export type SortDir = 'asc' | 'desc'

export type StatusTone = 'green' | 'blue' | 'yellow' | 'orange' | 'red' | 'grey' | 'neutral'

export type FieldKind = 'text' | 'link' | 'date' | 'datetime' | 'number'

export type FieldDef = {
  key: keyof RecordRow
  label: string
  kind: FieldKind
}
