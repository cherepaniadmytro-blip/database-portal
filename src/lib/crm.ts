/**
 * CRM-lite: relation types, outreach statuses, quick marks, channels, geography and copy-only
 * letter templates. Workflow data (status, marks, assignee, interactions) lives in
 * record_workflow / record_interactions / workflow_events and is readable only by
 * signed-in team members (RLS). Anonymous visitors see only relation_type.
 * Nothing here sends a message: templates are filled for copy/paste only.
 */
import type { Locale } from '../i18n/locales.ts'

export const RELATIONS = ['client', 'partner', 'media', 'job', 'info'] as const
export type Relation = (typeof RELATIONS)[number]
export const PIPELINE_RELATIONS: readonly Relation[] = ['client', 'partner', 'media', 'job', 'info']

export const STATUSES = ['new', 'started', 'reviewed', 'contacted', 'replied', 'working', 'declined'] as const
export type OutreachStatus = (typeof STATUSES)[number]
export const WORK_STATUSES: readonly OutreachStatus[] = ['started', 'reviewed', 'contacted', 'replied', 'working', 'declined']

export const MARKS = ['joined_group', 'letter_sent', 'called', 'in_telegram'] as const
export type WorkflowMark = (typeof MARKS)[number]

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

const LEGACY_STATUS_MAP: Record<string, OutreachStatus> = {
  selected: 'started',
  draft_ready: 'reviewed',
  agreed: 'working',
}

export function normalizeWorkflowStatus(value: unknown): OutreachStatus {
  if (typeof value !== 'string') return 'new'
  if ((STATUSES as readonly string[]).includes(value)) return value as OutreachStatus
  return LEGACY_STATUS_MAP[value] ?? 'new'
}

/** Colours: red -> orange -> yellow -> blue -> green progression, grey = declined, neutral = untouched. */
export function statusTone(status: OutreachStatus | null | undefined): Tone {
  switch (status) {
    case 'started':
      return 'red'
    case 'reviewed':
      return 'orange'
    case 'contacted':
      return 'yellow'
    case 'replied':
      return 'blue'
    case 'working':
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
export function isMark(value: unknown): value is WorkflowMark {
  return typeof value === 'string' && (MARKS as readonly string[]).includes(value)
}
export function isChannel(value: unknown): value is Channel {
  return typeof value === 'string' && (CHANNELS as readonly string[]).includes(value)
}

export type WorkflowRow = {
  recordId: string
  relationType: Relation | null
  status: OutreachStatus
  marks: WorkflowMark[]
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

export type TeamMember = { id: string; email: string; role: string; display_name?: string | null }

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

export function parseMarks(value: unknown): WorkflowMark[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<WorkflowMark>()
  for (const item of value) {
    if (isMark(item)) seen.add(item)
  }
  return MARKS.filter((mark) => seen.has(mark))
}

export function parseWorkflow(raw: Record<string, unknown>): WorkflowRow | null {
  const recordId = text(raw.record_id)
  if (!recordId) return null
  return {
    recordId,
    relationType: isRelation(raw.relation_type) ? raw.relation_type : null,
    status: normalizeWorkflowStatus(raw.status),
    marks: parseMarks(raw.marks),
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

export function displayMemberName(email: string | null | undefined, displayName?: string | null): string {
  const clean = typeof displayName === 'string' ? displayName.trim() : ''
  if (clean) return clean
  if (!email) return '—'
  const at = email.indexOf('@')
  return at > 0 ? email.slice(0, at) : email
}

export function memberDisplayName(
  team: readonly TeamMember[],
  userId?: string | null,
  fallbackEmail?: string | null,
): string {
  const byId = userId ? team.find((m) => m.id === userId) : undefined
  if (byId) return displayMemberName(byId.email, byId.display_name)
  const cleanEmail = fallbackEmail?.trim().toLowerCase()
  const byEmail = cleanEmail ? team.find((m) => m.email.toLowerCase() === cleanEmail) : undefined
  if (byEmail) return displayMemberName(byEmail.email, byEmail.display_name)
  return displayMemberName(fallbackEmail)
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

export type MemberStats = {
  id: string
  email: string
  displayName: string
  role: string
  taken: number
  byStatus: Record<OutreachStatus, number>
  byMark: Record<WorkflowMark, number>
  lettersOut: number
  repliesIn: number
  notes: number
}

function emptyStatusCounts(): Record<OutreachStatus, number> {
  return { new: 0, started: 0, reviewed: 0, contacted: 0, replied: 0, working: 0, declined: 0 }
}

function emptyMarkCounts(): Record<WorkflowMark, number> {
  return { joined_group: 0, letter_sent: 0, called: 0, in_telegram: 0 }
}

export function computeTeamStats(
  workflows: Map<string, WorkflowRow>,
  interactions: Interaction[],
  team: TeamMember[],
): { members: MemberStats[]; unassigned: MemberStats; totals: MemberStats } {
  const byId = new Map<string, MemberStats>()
  const byEmail = new Map<string, MemberStats>()
  for (const member of team) {
    const row: MemberStats = {
      id: member.id,
      email: member.email,
      displayName: displayMemberName(member.email, member.display_name),
      role: member.role,
      taken: 0,
      byStatus: emptyStatusCounts(),
      byMark: emptyMarkCounts(),
      lettersOut: 0,
      repliesIn: 0,
      notes: 0,
    }
    byId.set(member.id, row)
    byEmail.set(member.email.toLowerCase(), row)
  }
  const unassigned: MemberStats = {
    id: '',
    email: '',
    displayName: '',
    role: '',
    taken: 0,
    byStatus: emptyStatusCounts(),
    byMark: emptyMarkCounts(),
    lettersOut: 0,
    repliesIn: 0,
    notes: 0,
  }
  const totals: MemberStats = {
    id: 'total',
    email: 'total',
    displayName: 'total',
    role: '',
    taken: 0,
    byStatus: emptyStatusCounts(),
    byMark: emptyMarkCounts(),
    lettersOut: 0,
    repliesIn: 0,
    notes: 0,
  }

  for (const wf of workflows.values()) {
    const target = wf.assignedTo ? (byId.get(wf.assignedTo) ?? unassigned) : unassigned
    if (wf.assignedTo) {
      target.taken += 1
      totals.taken += 1
    }
    target.byStatus[wf.status] += 1
    totals.byStatus[wf.status] += 1
    for (const mark of wf.marks) {
      target.byMark[mark] += 1
      totals.byMark[mark] += 1
    }
  }

  for (const entry of interactions) {
    const target =
      (entry.authorId ? byId.get(entry.authorId) : undefined) ??
      (entry.authorEmail ? byEmail.get(entry.authorEmail.toLowerCase()) : undefined) ??
      unassigned
    if (entry.direction === 'out') {
      target.lettersOut += 1
      totals.lettersOut += 1
    } else if (entry.direction === 'in') {
      target.repliesIn += 1
      totals.repliesIn += 1
    } else {
      target.notes += 1
      totals.notes += 1
    }
  }

  return { members: [...byId.values()], unassigned, totals }
}

/* ---------------- templates (copy only, never sent from the portal) ---------------- */

export type TemplateLang = 'uk' | 'sk' | 'de'
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
    sk: 'Dobrý deň{{, контакт}}, volám sa {{ваше_імʼя}} z tímu FinanzHelper — nezávislej viacjazyčnej platformy, ktorá jednoducho vysvetľuje dôchodok a Altersvorsorge v Nemecku a pomáha nájsť licencovaného poradcu hovoriaceho {{мова_sk}}. Sami finančné poradenstvo nepredávame. Mohli by sme v „{{назва}}“ jednorazovo uverejniť krátky informačný príspevok pre členov? Ak to pravidlá skupiny nepovoľujú, úplne to chápeme. Ďakujeme! {{посилання}}',
    de: 'Guten Tag{{, контакт}}, mein Name ist {{ваше_імʼя}} vom Team FinanzHelper – einer unabhängigen, mehrsprachigen Plattform, die Rente und Altersvorsorge in Deutschland einfach erklärt und bei der Suche nach zugelassenen Beraterinnen und Beratern in der eigenen Sprache hilft. Wir verkaufen selbst keine Finanzberatung. Dürften wir in „{{назва}}“ einmalig einen kurzen Informationsbeitrag für die Mitglieder veröffentlichen? Falls die Gruppenregeln das nicht erlauben, ist das völlig in Ordnung. Vielen Dank! {{посилання}}',
  },
  media: {
    uk: 'Добрий день! Я {{ваше_імʼя}} з FinanzHelper ({{посилання}}). Ми плануємо інформаційну кампанію для людей у Німеччині, які говорять {{мова}}, про пенсію та Altersvorsorge. Підкажіть, будь ласка, умови реклами або гостьового матеріалу в «{{назва}}»: формати, ціни, охоплення й найближчі вільні дати? Дякую!',
    sk: 'Dobrý deň, som {{ваше_імʼя}} z FinanzHelper ({{посилання}}). Plánujeme informačnú kampaň o dôchodku a Altersvorsorge pre ľudí v Nemecku, ktorí hovoria {{мова_sk}}. Mohli by ste nám prosím poslať podmienky reklamy alebo hosťovského príspevku v „{{назва}}“ (formáty, ceny, dosah a najbližšie voľné termíny)? Ďakujem!',
    de: 'Guten Tag, ich bin {{ваше_імʼя}} von FinanzHelper ({{посилання}}). Wir planen eine Informationskampagne zu Rente und Altersvorsorge für Menschen in Deutschland, die {{Sprache}} sprechen. Könnten Sie uns die Mediadaten von „{{назва}}“ schicken (Formate, Preise, Reichweite, nächste freie Termine)? Vielen Dank!',
  },
  partner_org: {
    uk: 'Добрий день{{, контакт}}! Мене звати {{ваше_імʼя}}, я з FinanzHelper — незалежної багатомовної платформи, що пояснює пенсію й Altersvorsorge у Німеччині та допомагає знайти уповноваженого консультанта рідною мовою. Ми бачимо, що «{{назва}}» об\'єднує людей у {{місто}}, які говорять {{мова}}. Чи було б вам цікаво провести безкоштовну інформаційну зустріч (онлайн або у вас) або розмістити нашу коротку памʼятку для членів? Із задоволенням розповім деталі телефоном чи листом. Якщо тема вам не цікава — просто дайте знати, і ми більше не писатимемо. {{посилання}}',
    sk: 'Dobrý deň{{, контакт}}, volám sa {{ваше_імʼя}} z FinanzHelper — nezávislej viacjazyčnej platformy, ktorá zrozumiteľne vysvetľuje dôchodok a Altersvorsorge v Nemecku a prepája s licencovanými poradcami v rodnom jazyku. Vidíme, že „{{назва}}“ spája ľudí v meste {{місто}}, ktorí hovoria {{мова_sk}}. Mali by ste záujem o bezplatné informačné stretnutie (online alebo u vás) alebo o krátky leták pre členov? Rád vysvetlím podrobnosti. Ak téma nie je aktuálna, stačí krátka odpoveď a nebudeme vás viac rušiť. {{посилання}}',
    de: 'Guten Tag{{, контакт}}, mein Name ist {{ваше_імʼя}} von FinanzHelper, einer unabhängigen, mehrsprachigen Plattform, die Rente und Altersvorsorge in Deutschland verständlich erklärt und zugelassene Beraterinnen und Berater in der Muttersprache vermittelt. „{{назва}}“ ist ein wichtiger Treffpunkt für Menschen in {{місто}}, die {{Sprache}} sprechen. Hätten Sie Interesse an einer kostenlosen Informationsveranstaltung (online oder vor Ort) oder an einem kurzen Merkblatt für Ihre Mitglieder? Gern erläutere ich die Details. Falls kein Interesse besteht, genügt eine kurze Nachricht – wir melden uns dann nicht wieder. {{посилання}}',
  },
  consultant: {
    uk: 'Добрий день{{, контакт}}! Я {{ваше_імʼя}} з FinanzHelper. Ми будуємо мережу уповноважених консультантів, які в Німеччині консультують {{мова}}: платформа пояснює тему й передає консультанту лише ті звернення, де людина сама попросила консультацію. Чи цікаво вам дізнатися умови співпраці? Будь-які домовленості — лише після окремого договору. {{посилання}}',
    sk: 'Dobrý deň{{, контакт}}, som {{ваше_імʼя}} z FinanzHelper. Budujeme sieť licencovaných poradcov, ktorí v Nemecku radia {{мова_sk}}: platforma tému vysvetlí a poradcovi odovzdá iba dopyty, kde si človek sám vyžiadal konzultáciu. Zaujímalo by vás dozvedieť sa podmienky spolupráce? Záväzné je všetko až po samostatnej zmluve. {{посилання}}',
    de: 'Guten Tag{{, контакт}}, ich bin {{ваше_імʼя}} von FinanzHelper. Wir bauen ein Netzwerk zugelassener Beraterinnen und Berater auf, die in Deutschland auf {{Sprache}} beraten. Die Plattform informiert und leitet nur Anfragen weiter, bei denen Nutzer ausdrücklich eine Beratung wünschen. Hätten Sie Interesse, die Bedingungen kennenzulernen? Verbindlich wird alles erst mit einem individuellen Vertrag. {{посилання}}',
  },
  agency: {
    uk: 'Добрий день! Я {{ваше_імʼя}} з FinanzHelper ({{посилання}}). Багато працівників, яких ви влаштовуєте в Німеччині, мають питання про пенсію, податки й Altersvorsorge рідною мовою. Ми можемо безкоштовно надати памʼятку {{мова}} або коротку онлайн-зустріч для ваших працівників. Чи цікаво вам? Якщо ні — дякуємо, більше не писатимемо.',
    sk: 'Dobrý deň, som {{ваше_імʼя}} z FinanzHelper ({{посилання}}). Mnohí pracovníci, ktorých umiestňujete v Nemecku, majú otázky o dôchodku, daniach a Altersvorsorge v rodnom jazyku. Radi bezplatne poskytneme leták {{мова_sk}} alebo krátke online informačné stretnutie pre vašich pracovníkov. Zaujalo by vás to? Ak nie, ďakujeme a už nebudeme písať.',
    de: 'Guten Tag, ich bin {{ваше_імʼя}} von FinanzHelper ({{посилання}}). Viele Arbeitskräfte, die Sie in Deutschland vermitteln, haben Fragen zu Rente, Steuern und Altersvorsorge in ihrer Muttersprache. Gern stellen wir kostenlos ein Merkblatt auf {{Sprache}} oder eine kurze Online-Infostunde für Ihre Mitarbeitenden bereit. Besteht Interesse? Falls nicht, melden wir uns nicht wieder.',
  },
  followup: {
    uk: 'Добрий день! Нагадую про своє повідомлення від {{дата}} щодо FinanzHelper. Якщо зараз не на часі — нічого страшного, дайте знати, і я позначу це в себе. Дякую!',
    sk: 'Dobrý deň, dovoľujem si pripomenúť svoju správu zo dňa {{дата}} ohľadom FinanzHelper. Ak to teraz nie je aktuálne, nič sa nedeje, stačí dať vedieť a poznačím si to. Ďakujem!',
    de: 'Guten Tag, ich erlaube mir, an meine Nachricht vom {{дата}} zu FinanzHelper zu erinnern. Falls es gerade nicht passt, genügt eine kurze Rückmeldung. Vielen Dank!',
  },
}

/** Language name in instrumental/adverbial case for uk, sk and German. */
const LANGUAGE_WORDS: Record<string, { uk: string; sk: string; de: string }> = {
  Ukrainian: { uk: 'українською', sk: 'po ukrajinsky', de: 'Ukrainisch' },
  'Russian-speaking': { uk: 'російською', sk: 'po rusky', de: 'Russisch' },
  Polish: { uk: 'польською', sk: 'po poľsky', de: 'Polnisch' },
  'Arabic-speaking': { uk: 'арабською', sk: 'po arabsky', de: 'Arabisch' },
  Turkish: { uk: 'турецькою', sk: 'po turecky', de: 'Türkisch' },
  Kurdish: { uk: 'курдською', sk: 'po kurdsky', de: 'Kurdisch' },
  Bulgarian: { uk: 'болгарською', sk: 'po bulharsky', de: 'Bulgarisch' },
  Czech: { uk: 'чеською', sk: 'po česky', de: 'Tschechisch' },
  Slovak: { uk: 'словацькою', sk: 'po slovensky', de: 'Slowakisch' },
  'Czech/Slovak': { uk: 'чеською чи словацькою', sk: 'po česky alebo po slovensky', de: 'Tschechisch oder Slowakisch' },
  Romanian: { uk: 'румунською', sk: 'po rumunsky', de: 'Rumänisch' },
  Hungarian: { uk: 'угорською', sk: 'po maďarsky', de: 'Ungarisch' },
  'BCMS (Croatian/Serbian/Bosnian)': { uk: 'хорватською, сербською чи боснійською', sk: 'po chorvátsky, srbsky alebo bosniansky', de: 'Kroatisch, Serbisch oder Bosnisch' },
  Albanian: { uk: 'албанською', sk: 'po albánsky', de: 'Albanisch' },
  Greek: { uk: 'грецькою', sk: 'po grécky', de: 'Griechisch' },
  Italian: { uk: 'італійською', sk: 'po taliansky', de: 'Italienisch' },
  'Persian/Dari': { uk: 'перською (фарсі чи дарі)', sk: 'po perzsky (fársí alebo darí)', de: 'Persisch (Farsi oder Dari)' },
  Vietnamese: { uk: 'вʼєтнамською', sk: 'po vietnamsky', de: 'Vietnamesisch' },
  Chinese: { uk: 'китайською', sk: 'po čínsky', de: 'Chinesisch' },
  Spanish: { uk: 'іспанською', sk: 'po španielsky', de: 'Spanisch' },
  Portuguese: { uk: 'португальською', sk: 'po portugalsky', de: 'Portugiesisch' },
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
  const missingCity = lang === 'de' ? '[Stadt]' : lang === 'sk' ? '[mesto]' : '[місто]'
  const missingSender = lang === 'de' ? '[Ihr Name]' : lang === 'sk' ? '[Vaše meno]' : '[ваше імʼя]'
  const missingDate = lang === 'de' ? '[Datum]' : lang === 'sk' ? '[dátum]' : '[дата]'
  const values: Record<string, string> = {
    назва: input.name,
    місто: input.city?.trim() || missingCity,
    мова: words?.uk ?? '[мовою]',
    мова_sk: words?.sk ?? '[jazykom]',
    Sprache: words?.de ?? '[Sprache]',
    ваше_імʼя: input.senderName?.trim() || missingSender,
    посилання: input.link ?? 'https://fh-bd.de',
    дата: input.date?.trim() || missingDate,
  }
  return templateText(id, lang)
    .replace(/\{\{, контакт\}\}/g, contact ? `, ${contact}` : '')
    .replace(/\{\{([^}]+)\}\}/g, (match, key: string) => values[key] ?? match)
}

export function templateLangFor(locale: Locale): TemplateLang {
  return locale === 'sk' ? 'sk' : 'uk'
}
