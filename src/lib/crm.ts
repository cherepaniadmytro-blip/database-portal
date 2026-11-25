/**
 * CRM-lite: relation types, outreach statuses, channels, geography and copy-only
 * letter templates. Workflow data (status, assignee, interactions) lives in
 * record_workflow / record_interactions / workflow_events and is readable only by
 * signed-in team members (RLS). Anonymous visitors see only relation_type.
 * Nothing here sends a message: templates are filled for copy/paste only.
 */
import type { Locale } from '../i18n/locales.ts'

export const RELATIONS = ['client', 'partner', 'media', 'job', 'info'] as const
export type Relation = (typeof RELATIONS)[number]
export const PIPELINE_RELATIONS: readonly Relation[] = ['client', 'partner', 'media', 'job']

export const STATUSES = ['new', 'selected', 'draft_ready', 'contacted', 'replied', 'agreed', 'declined'] as const
export type OutreachStatus = (typeof STATUSES)[number]

export const CHANNELS = ['email', 'telegram', 'facebook', 'phone', 'form', 'instagram'] as const
export type Channel = (typeof CHANNELS)[number]
export const LOG_CHANNELS = [...CHANNELS, 'meeting', 'other'] as const
export type LogChannel = (typeof LOG_CHANNELS)[number]

export const DIRECTIONS = ['out', 'in', 'note'] as const
export type Direction = (typeof DIRECTIONS)[number]

export const GEO_SCOPES = [
  'Germany',
  'Online (Germany)',
  'Slovakia',
  'Czechia',
  'Czechia/Slovakia',
  'Poland',
  'Austria',
  'Switzerland',
  'Europe-wide',
  'Online / global',
  'USA',
  'Not applicable',
  'Unknown',
] as const

export type Tone = 'neutral' | 'red' | 'orange' | 'yellow' | 'blue' | 'green' | 'grey'

/** Colours requested by the owner: red/orange = action needed, yellow = draft, blue = waiting, green = answered/agreed, grey = declined. */
export function statusTone(status: OutreachStatus | null | undefined): Tone {
  switch (status) {
    case 'selected':
      return 'red'
    case 'draft_ready':
      return 'yellow'
    case 'contacted':
      return 'blue'
    case 'replied':
    case 'agreed':
      return 'green'
    case 'declined':
      return 'grey'
    default:
      return 'neutral'
  }
}

export function isRelation(value: unknown): value is Relation {
  return typeof value === 'string' && (RELATIONS as readonly string[]).includes(value)
}
export function isStatus(value: unknown): value is OutreachStatus {
  return typeof value === 'string' && (STATUSES as readonly string[]).includes(value)
}
export function isChannel(value: unknown): value is Channel {
  return typeof value === 'string' && (CHANNELS as readonly string[]).includes(value)
}

export type WorkflowRow = {
  recordId: string
  relationType: Relation | null
  status: OutreachStatus
  assignedTo: string | null
  nextStep: string | null
  contactedAt: string | null
  updatedBy: string | null
  updatedByEmail: string | null
  updatedAt: string | null
}

export type Interaction = {
  id: number
  recordId: string
  authorId: string | null
  authorEmail: string | null
  createdAt: string
  direction: Direction
  channel: LogChannel | null
  summary: string
  nextStep: string | null
}

export type WorkflowEvent = {
  id: number
  recordId: string
  actorEmail: string | null
  createdAt: string
  event: string
  oldValue: string | null
  newValue: string | null
}

export type TeamMember = { id: string; email: string; role: string }

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

export function parseWorkflow(raw: Record<string, unknown>): WorkflowRow | null {
  const recordId = text(raw.record_id)
  if (!recordId) return null
  return {
    recordId,
    relationType: isRelation(raw.relation_type) ? raw.relation_type : null,
    status: isStatus(raw.status) ? raw.status : 'new',
    assignedTo: text(raw.assigned_to),
    nextStep: text(raw.next_step),
    contactedAt: text(raw.contacted_at),
    updatedBy: text(raw.updated_by),
    updatedByEmail: text(raw.updated_by_email),
    updatedAt: text(raw.updated_at),
  }
}

export function parseInteraction(raw: Record<string, unknown>): Interaction | null {
  const id = typeof raw.id === 'number' ? raw.id : Number(raw.id)
  const recordId = text(raw.record_id)
  const summary = text(raw.summary)
  if (!Number.isFinite(id) || !recordId || !summary) return null
  const direction = raw.direction === 'in' || raw.direction === 'note' ? raw.direction : 'out'
  const channel = typeof raw.channel === 'string' && (LOG_CHANNELS as readonly string[]).includes(raw.channel) ? (raw.channel as LogChannel) : null
  return {
    id,
    recordId,
    authorId: text(raw.author_id),
    authorEmail: text(raw.author_email),
    createdAt: text(raw.created_at) ?? '',
    direction,
    channel,
    summary,
    nextStep: text(raw.next_step),
  }
}

export function parseEvent(raw: Record<string, unknown>): WorkflowEvent | null {
  const id = typeof raw.id === 'number' ? raw.id : Number(raw.id)
  const recordId = text(raw.record_id)
  const event = text(raw.event)
  if (!Number.isFinite(id) || !recordId || !event) return null
  return {
    id,
    recordId,
    actorEmail: text(raw.actor_email),
    createdAt: text(raw.created_at) ?? '',
    event,
    oldValue: text(raw.old_value),
    newValue: text(raw.new_value),
  }
}

/** Effective relation: a team decision overrides the suggestion stored on the record. */
export function effectiveRelation(suggested: Relation | null, workflow: WorkflowRow | undefined): Relation | null {
  return workflow?.relationType ?? suggested
}

export type PipelineItem<T> = { row: T; workflow: WorkflowRow | undefined }

/** Groups records of one relation type by outreach status (pipeline columns). */
export function groupByStatus<T extends { id: string }>(
  rows: T[],
  workflows: Map<string, WorkflowRow>,
  relation: Relation,
  relationOf: (row: T) => Relation | null,
  filter: (item: PipelineItem<T>) => boolean = () => true,
): Record<OutreachStatus, PipelineItem<T>[]> {
  const out = Object.fromEntries(STATUSES.map((s) => [s, [] as PipelineItem<T>[]])) as Record<OutreachStatus, PipelineItem<T>[]>
  for (const row of rows) {
    const workflow = workflows.get(row.id)
    if (effectiveRelation(relationOf(row), workflow) !== relation) continue
    const item = { row, workflow }
    if (!filter(item)) continue
    out[workflow?.status ?? 'new'].push(item)
  }
  return out
}

/* ---------------- templates (copy only, never sent from the portal) ---------------- */

export type TemplateLang = 'uk' | 'de'
export type TemplateId = 'community' | 'media' | 'partner_org' | 'consultant' | 'agency' | 'followup'

export const TEMPLATE_IDS: readonly TemplateId[] = ['community', 'media', 'partner_org', 'consultant', 'agency', 'followup']

export function defaultTemplate(relation: Relation | null, entityType: string | null): TemplateId {
  const entity = (entityType ?? '').toLowerCase()
  if (relation === 'client') return 'community'
  if (relation === 'media') return 'media'
  if (entity.includes('staffing')) return 'agency'
  if (entity.includes('consultant')) return 'consultant'
  return 'partner_org'
}

const TEMPLATES: Record<TemplateId, Record<TemplateLang, string>> = {
  community: {
    uk: 'Добрий день{{, контакт}}! Мене звати {{ваше_імʼя}}, я з команди FinanzHelper — незалежної багатомовної платформи, яка простими словами пояснює пенсію та Altersvorsorge у Німеччині й допомагає знайти уповноваженого консультанта, що говорить {{мова}}. Ми самі фінансових консультацій не продаємо. Чи можна в «{{назва}}» один раз опублікувати короткий інформаційний допис для учасників? Якщо правила групи це забороняють — зрозуміємо, дякую за відповідь. {{посилання}}',
    de: 'Guten Tag{{, контакт}}, mein Name ist {{ваше_імʼя}} vom Team FinanzHelper – einer unabhängigen, mehrsprachigen Plattform, die Rente und Altersvorsorge in Deutschland einfach erklärt und bei der Suche nach zugelassenen Beraterinnen und Beratern in der eigenen Sprache hilft. Wir verkaufen selbst keine Finanzberatung. Dürften wir in „{{назва}}“ einmalig einen kurzen Informationsbeitrag für die Mitglieder veröffentlichen? Falls die Gruppenregeln das nicht erlauben, ist das völlig in Ordnung. Vielen Dank! {{посилання}}',
  },
  media: {
    uk: 'Добрий день! Я {{ваше_імʼя}} з FinanzHelper ({{посилання}}). Ми плануємо інформаційну кампанію для людей у Німеччині, які говорять {{мова}}, про пенсію та Altersvorsorge. Підкажіть, будь ласка, умови реклами або гостьового матеріалу в «{{назва}}»: формати, ціни, охоплення й найближчі вільні дати? Дякую!',
    de: 'Guten Tag, ich bin {{ваше_імʼя}} von FinanzHelper ({{посилання}}). Wir planen eine Informationskampagne zu Rente und Altersvorsorge für Menschen in Deutschland, die {{Sprache}} sprechen. Könnten Sie uns die Mediadaten von „{{назва}}“ schicken (Formate, Preise, Reichweite, nächste freie Termine)? Vielen Dank!',
  },
  partner_org: {
    uk: 'Добрий день{{, контакт}}! Мене звати {{ваше_імʼя}}, я з FinanzHelper — незалежної багатомовної платформи, що пояснює пенсію й Altersvorsorge у Німеччині та допомагає знайти уповноваженого консультанта рідною мовою. Ми бачимо, що «{{назва}}» об\'єднує людей у {{місто}}, які говорять {{мова}}. Чи було б вам цікаво провести безкоштовну інформаційну зустріч (онлайн або у вас) або розмістити нашу коротку памʼятку для членів? Із задоволенням розповім деталі телефоном чи листом. Якщо тема вам не цікава — просто дайте знати, і ми більше не писатимемо. {{посилання}}',
    de: 'Guten Tag{{, контакт}}, mein Name ist {{ваше_імʼя}} von FinanzHelper, einer unabhängigen, mehrsprachigen Plattform, die Rente und Altersvorsorge in Deutschland verständlich erklärt und zugelassene Beraterinnen und Berater in der Muttersprache vermittelt. „{{назва}}“ ist ein wichtiger Treffpunkt für Menschen in {{місто}}, die {{Sprache}} sprechen. Hätten Sie Interesse an einer kostenlosen Informationsveranstaltung (online oder vor Ort) oder an einem kurzen Merkblatt für Ihre Mitglieder? Gern erläutere ich die Details. Falls kein Interesse besteht, genügt eine kurze Nachricht – wir melden uns dann nicht wieder. {{посилання}}',
  },
  consultant: {
    uk: 'Добрий день{{, контакт}}! Я {{ваше_імʼя}} з FinanzHelper. Ми будуємо мережу уповноважених консультантів, які в Німеччині консультують {{мова}}: платформа пояснює тему й передає консультанту лише ті звернення, де людина сама попросила консультацію. Чи цікаво вам дізнатися умови співпраці? Будь-які домовленості — лише після окремого договору. {{посилання}}',
    de: 'Guten Tag{{, контакт}}, ich bin {{ваше_імʼя}} von FinanzHelper. Wir bauen ein Netzwerk zugelassener Beraterinnen und Berater auf, die in Deutschland auf {{Sprache}} beraten. Die Plattform informiert und leitet nur Anfragen weiter, bei denen Nutzer ausdrücklich eine Beratung wünschen. Hätten Sie Interesse, die Bedingungen kennenzulernen? Verbindlich wird alles erst mit einem individuellen Vertrag. {{посилання}}',
  },
  agency: {
    uk: 'Добрий день! Я {{ваше_імʼя}} з FinanzHelper ({{посилання}}). Багато працівників, яких ви влаштовуєте в Німеччині, мають питання про пенсію, податки й Altersvorsorge рідною мовою. Ми можемо безкоштовно надати памʼятку {{мова}} або коротку онлайн-зустріч для ваших працівників. Чи цікаво вам? Якщо ні — дякуємо, більше не писатимемо.',
    de: 'Guten Tag, ich bin {{ваше_імʼя}} von FinanzHelper ({{посилання}}). Viele Arbeitskräfte, die Sie in Deutschland vermitteln, haben Fragen zu Rente, Steuern und Altersvorsorge in ihrer Muttersprache. Gern stellen wir kostenlos ein Merkblatt auf {{Sprache}} oder eine kurze Online-Infostunde für Ihre Mitarbeitenden bereit. Besteht Interesse? Falls nicht, melden wir uns nicht wieder.',
  },
  followup: {
    uk: 'Добрий день! Нагадую про своє повідомлення від {{дата}} щодо FinanzHelper. Якщо зараз не на часі — нічого страшного, дайте знати, і я позначу це в себе. Дякую!',
    de: 'Guten Tag, ich erlaube mir, an meine Nachricht vom {{дата}} zu FinanzHelper zu erinnern. Falls es gerade nicht passt, genügt eine kurze Rückmeldung. Vielen Dank!',
  },
}

/** Instrumental case (uk) and German name for each language group, used by templates. */
const LANGUAGE_WORDS: Record<string, { uk: string; de: string }> = {
  Ukrainian: { uk: 'українською', de: 'Ukrainisch' },
  'Russian-speaking': { uk: 'російською', de: 'Russisch' },
  Polish: { uk: 'польською', de: 'Polnisch' },
  'Arabic-speaking': { uk: 'арабською', de: 'Arabisch' },
  Turkish: { uk: 'турецькою', de: 'Türkisch' },
  Kurdish: { uk: 'курдською', de: 'Kurdisch' },
  Bulgarian: { uk: 'болгарською', de: 'Bulgarisch' },
  Czech: { uk: 'чеською', de: 'Tschechisch' },
  Slovak: { uk: 'словацькою', de: 'Slowakisch' },
  'Czech/Slovak': { uk: 'чеською чи словацькою', de: 'Tschechisch oder Slowakisch' },
  Romanian: { uk: 'румунською', de: 'Rumänisch' },
  Hungarian: { uk: 'угорською', de: 'Ungarisch' },
  'BCMS (Croatian/Serbian/Bosnian)': { uk: 'хорватською, сербською чи боснійською', de: 'Kroatisch, Serbisch oder Bosnisch' },
  Albanian: { uk: 'албанською', de: 'Albanisch' },
  Greek: { uk: 'грецькою', de: 'Griechisch' },
  Italian: { uk: 'італійською', de: 'Italienisch' },
  'Persian/Dari': { uk: 'перською (фарсі чи дарі)', de: 'Persisch (Farsi oder Dari)' },
  Vietnamese: { uk: 'вʼєтнамською', de: 'Vietnamesisch' },
  Chinese: { uk: 'китайською', de: 'Chinesisch' },
  Spanish: { uk: 'іспанською', de: 'Spanisch' },
  Portuguese: { uk: 'португальською', de: 'Portugiesisch' },
}

export type TemplateInput = {
  name: string
  city: string | null
  languageGroup: string | null
  contactName?: string | null
  senderName?: string | null
  date?: string | null
  link?: string
}

export function templateText(id: TemplateId, lang: TemplateLang): string {
  return TEMPLATES[id][lang]
}

/** Fills placeholders; unknown values become visible [brackets] so nothing is invented. */
export function fillTemplate(id: TemplateId, lang: TemplateLang, input: TemplateInput): string {
  const words = input.languageGroup ? LANGUAGE_WORDS[input.languageGroup] : undefined
  const contact = input.contactName?.trim()
  const values: Record<string, string> = {
    назва: input.name,
    місто: input.city?.trim() || (lang === 'de' ? '[Stadt]' : '[місто]'),
    мова: words?.uk ?? '[мовою]',
    Sprache: words?.de ?? '[Sprache]',
    ваше_імʼя: input.senderName?.trim() || (lang === 'de' ? '[Ihr Name]' : '[ваше імʼя]'),
    посилання: input.link ?? 'https://fh-bd.de',
    дата: input.date?.trim() || (lang === 'de' ? '[Datum]' : '[дата]'),
  }
  return templateText(id, lang)
    .replace(/\{\{, контакт\}\}/g, contact ? `, ${contact}` : '')
    .replace(/\{\{([^}]+)\}\}/g, (match, key: string) => values[key] ?? match)
}

export function templateLangFor(locale: Locale): TemplateLang {
  return locale === 'sk' ? 'de' : 'uk'
}
