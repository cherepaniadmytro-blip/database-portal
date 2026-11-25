import { entityLabel, formatCatalogLabel, recordsWord } from '../i18n/index.ts'
import { DEFAULT_LOCALE, type Locale } from '../i18n/locales.ts'
import { normStatus, priorityWeight } from './records.ts'
import { isChannel, isRelation, type Channel, type Relation } from './crm.ts'

/**
 * public_records (live): id, category, category_label, subcategory, title, name,
 * description, organization, country, city, language_community, website, source_url,
 * details_link, source, published_date, status, priority, reliability, potential,
 * partner_type, rating_score, audience_size, language_group, nationality, platform,
 * entity_type, date_added, last_updated, last_checked, synced_at.
 * catalog_facets is a view: language_group, platform, n.
 * A null language_group is 'Not applicable' (shown apart from the groups as
 * «Інше / не спільноти»). Cards use language_group_label when the row has one.
 * Derivation runs only when the language_group / platform columns are absent.
 */

export const NON_COMMUNITY_GROUP = 'Not applicable'
export const NON_COMMUNITY_LABEL = 'Інше / не спільноти'

export const GROUP_ORDER = [
  'Ukrainian',
  'українськомовні',
  'Russian-speaking',
  'російськомовні',
  'Polish',
  'польські',
  'Arabic-speaking',
  'арабські',
  'Turkish',
  'турецькомовні',
  'Bulgarian',
  'болгарські',
  'Czech',
  'Slovak',
  'Czech/Slovak',
  'словацькі',
  'чеські / словацькі',
  'Romanian',
  'румунські',
] as const

export const PLATFORM_ORDER = [
  'Facebook',
  'YouTube',
  'Telegram',
  'Instagram',
  'TikTok',
  'Website',
  'сайт/медіа',
  'блогер',
  'агенція',
  'організація',
  'консультант',
] as const

const GROUP_ALIASES: Record<string, string> = {
  українськомовні: 'українськомовні',
  ukrainian: 'українськомовні',
  'ukrainian-speaking': 'українськомовні',
  uk: 'українськомовні',
  російськомовні: 'російськомовні',
  russian: 'російськомовні',
  'russian-speaking': 'російськомовні',
  ru: 'російськомовні',
  польські: 'польські',
  polish: 'польські',
  pl: 'польські',
  арабські: 'арабські',
  arabic: 'арабські',
  'arabic-speaking': 'арабські',
  турецькомовні: 'турецькомовні',
  turkish: 'турецькомовні',
  tr: 'турецькомовні',
  болгарські: 'болгарські',
  bulgarian: 'болгарські',
  bg: 'болгарські',
  словацькі: 'словацькі',
  slovak: 'словацькі',
  sk: 'словацькі',
  'czech/slovak': 'чеські / словацькі',
  чеські: 'чеські',
  czech: 'чеські',
  cz: 'чеські',
  румунські: 'румунські',
  romanian: 'румунські',
  ro: 'румунські',
  німецькомовні: 'німецькомовні',
  german: 'німецькомовні',
  'german-speaking': 'німецькомовні',
  de: 'німецькомовні',
  угорські: 'угорські',
  hungarian: 'угорські',
  курдські: 'курдські',
  kurdish: 'курдські',
  албанські: 'албанські',
  albanian: 'албанські',
  грецькі: 'грецькі',
  greek: 'грецькі',
  італійські: 'італійські',
  italian: 'італійські',
  "в'єтнамські": "в'єтнамські",
  vietnamese: "в'єтнамські",
  іспанські: 'іспанські',
  spanish: 'іспанські',
  португальські: 'португальські',
  portuguese: 'португальські',
  китайські: 'китайські',
  chinese: 'китайські',
  індійські: 'індійські',
  indian: 'індійські',
  перські: 'перські',
  'persian/dari': 'перські',
  англомовні: 'англомовні',
  'english / international': 'англомовні',
  багатомовні: 'багатомовні',
  multilingual: 'багатомовні',
  'хорватські / сербські / боснійські': 'хорватські / сербські / боснійські',
  'bcms (croatian/serbian/bosnian)': 'хорватські / сербські / боснійські',
  'данські / сорбські / фризькі': 'данські / сорбські / фризькі',
  'danish/sorbian/frisian minorities': 'данські / сорбські / фризькі',
  інші: 'інші',
  інше: 'інші',
  other: 'інші',
  'other / unknown': 'інші',
  unknown: 'інші',
}

const PLATFORM_ALIASES: Record<string, string> = {
  facebook: 'Facebook',
  fb: 'Facebook',
  youtube: 'YouTube',
  telegram: 'Telegram',
  tg: 'Telegram',
  instagram: 'Instagram',
  ig: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  'сайт/медіа': 'сайт/медіа',
  'сайт / медіа': 'сайт/медіа',
  website: 'сайт/медіа',
  site: 'сайт/медіа',
  'офіційна статистика': 'офіційна статистика',
  'official statistics': 'офіційна статистика',
  'преса / радіо / тб': 'преса / радіо / тб',
  'print/radio/tv': 'преса / радіо / тб',
  блогер: 'блогер',
  blogger: 'блогер',
  агенція: 'агенція',
  agency: 'агенція',
  організація: 'організація',
  organization: 'організація',
  organisation: 'організація',
  консультант: 'консультант',
  consultant: 'консультант',
  інші: 'інші',
  інше: 'інші',
  other: 'інші',
  'other / unknown': 'інші',
  unknown: 'інші',
}

const LANGUAGE_RULES: Array<{ label: string; re: RegExp }> = [
  { label: 'українськомовні', re: /україн|ukrain|\buk\b/i },
  { label: 'російськомовні', re: /росі|рус|russian|\bru\b/i },
  { label: 'польські', re: /поль|поляк|polish|\bpl\b/i },
  { label: 'арабські', re: /араб|arab/i },
  { label: 'турецькомовні', re: /турец|turk/i },
  { label: 'болгарські', re: /болгар|bulgar/i },
  { label: 'словацькі', re: /словац|slovak|\bsk\b/i },
  { label: 'румунські', re: /румун|romanian|\bro\b/i },
  { label: 'чеські', re: /чесь|чех|czech|\bcz\b/i },
  { label: 'німецькомовні', re: /німец|german|\bde\b/i },
  { label: 'угорські', re: /угор|hungar/i },
  { label: 'хорватські', re: /хорват|croat/i },
  { label: 'сербські', re: /серб|serb/i },
  { label: 'боснійські', re: /босн|bosni/i },
  { label: 'курдські', re: /курд|kurd/i },
  { label: 'албанські', re: /албан|alban/i },
  { label: 'італійські', re: /італ|itali/i },
  { label: 'грецькі', re: /грец|greek/i },
  { label: 'данські', re: /дансь|danish/i },
  { label: 'англомовні', re: /англо|english|\ben\b/i },
  { label: 'сорбські', re: /сорб|sorb/i },
  { label: 'фризькі', re: /фриз|frisian/i },
]

const HOST_LANGUAGE = 'німецькомовні'

const UNSET = new Set(['', 'other', 'other / unknown', 'unknown', 'n/a', 'na', 'none', 'null', '-', '—'])

export type PublicRecord = {
  id: string
  category: string
  categoryLabel: string
  subcategory: string | null
  name: string
  description: string | null
  organization: string | null
  country: string | null
  city: string | null
  cityRegion: string | null
  place: string | null
  languageCommunity: string | null
  website: string | null
  sourceUrl: string | null
  detailsLink: string | null
  source: string | null
  publishedDate: string | null
  status: string | null
  priority: string | null
  reliability: number | null
  potential: number | null
  partnerType: string | null
  ratingScore: number | null
  audienceSize: number | null
  audienceSource: string | null
  languageGroup: string
  languageGroupLabel: string | null
  nationality: string | null
  platform: string
  entityType: string | null
  dateAdded: string | null
  lastUpdated: string | null
  lastChecked: string | null
  syncedAt: string | null
  languageFromColumn: boolean
  platformFromColumn: boolean
  /** Effective relation type (team decision or automatic suggestion). */
  relationType: Relation | null
  suggestedRelationType: Relation | null
  relationReason: string | null
  bestChannel: Channel | null
  channelReason: string | null
  /** Verified country / reach (geo_scope); falls back to the raw country column. */
  geoScope: string | null
  languageGroupLabelSk: string | null
}

export type FacetRow = {
  language_group: string
  platform: string
  n: number
}

export type CatalogCard = {
  key: string
  label: string
  count: number
}

export type CatalogModel = {
  groups: CatalogCard[]
  aside: CatalogCard | null
  platformsFor: (group: string) => CatalogCard[]
  basis: 'catalog_facets' | 'client'
}

export type CatalogListFilters = {
  q: string
  city: string
  /** Matches geoScope (verified country / reach). */
  country: string
  status: string
  category: string
  relation?: string
}

export function isUnsetClassification(value: string | null | undefined): boolean {
  return UNSET.has((value ?? '').trim().toLowerCase())
}

export function isNonCommunity(value: string | null | undefined): boolean {
  return (value ?? '').trim().toLowerCase() === NON_COMMUNITY_GROUP.toLowerCase()
}

export function languageKey(value: string | null | undefined): string {
  const text = (value ?? '').trim()
  return text || NON_COMMUNITY_GROUP
}

const PLATFORM_KEYS: Record<string, string> = {
  facebook: 'Facebook',
  youtube: 'YouTube',
  telegram: 'Telegram',
  instagram: 'Instagram',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  website: 'Website',
  other: 'Other',
  'official statistics': 'Official statistics',
  'print/radio/tv': 'Print/Radio/TV',
}

export function platformKey(value: string | null | undefined): string {
  const text = (value ?? '').trim()
  if (!text) return 'Other'
  return PLATFORM_KEYS[text.toLowerCase()] ?? text
}

export function recordsLabel(count: number, locale: Locale = DEFAULT_LOCALE): string {
  return recordsWord(count, locale)
}

export function displayEntity(value: string | null, locale: Locale = DEFAULT_LOCALE): string | null {
  if (!value) return null
  return entityLabel(value, locale)
}

export function displayLabel(key: string, locale: Locale = DEFAULT_LOCALE): string {
  if (isNonCommunity(key)) return formatCatalogLabel('Not applicable', locale)
  if (isOtherKey(key)) return formatCatalogLabel('інші', locale)
  return formatCatalogLabel(key, locale)
}

export function deriveLanguageGroup(community: string | null, nationality: string | null): string {
  const text = [community, nationality].filter((part) => part && part.trim()).join(' | ')
  if (!text.trim()) return 'інші'
  const parts = text
    .split(/[|/;,]+/)
    .map((part) => part.trim())
    .filter(Boolean)
  const perPart = parts.map(labelsFor)
  const diaspora = unique(perPart.flat().filter((label) => label !== HOST_LANGUAGE))
  const chosen = diaspora.length > 0 ? diaspora : unique(perPart.flat())
  if (chosen.length === 0) return 'інші'
  if (chosen.length === 1) return chosen[0] ?? 'інші'
  return chosen.join(' / ')
}

export function derivePlatform(input: {
  subcategory?: string | null
  website?: string | null
  sourceUrl?: string | null
}): string {
  const sub = input.subcategory ?? ''
  const subLower = sub.toLowerCase()
  const blob = `${sub}\n${input.website ?? ''}\n${input.sourceUrl ?? ''}`.toLowerCase()
  if (/^(organization\b|організац)/i.test(sub)) return 'організація'
  if (/agency|агенц|zeitarbeit|staffing/.test(subLower)) return 'агенція'
  if (/consultant|консультант|broker/.test(subLower)) return 'консультант'
  if (/facebook\.com|\bfacebook\b|\bfb\b/.test(blob)) return 'Facebook'
  if (/youtube\.com|youtu\.be|\byoutube\b/.test(blob)) return 'YouTube'
  if (/telegram|t\.me|\btg\b/.test(blob)) return 'Telegram'
  if (/instagram\.com|\binstagram\b/.test(blob)) return 'Instagram'
  if (/tiktok\.com|\btiktok\b/.test(blob)) return 'TikTok'
  if (/blogger|блогер/.test(subLower)) return 'блогер'
  if (/^https?:\/\//i.test((input.website ?? '').trim()) || /^https?:\/\//i.test((input.sourceUrl ?? '').trim())) {
    return 'сайт/медіа'
  }
  if (/website|сайт|медіа|\bmedia\b/.test(subLower)) return 'сайт/медіа'
  return 'інші'
}

export function canonicalGroup(value: string): string {
  const alias = GROUP_ALIASES[value.trim().toLowerCase()]
  return alias ?? value.trim()
}

export function canonicalPlatform(value: string): string {
  const alias = PLATFORM_ALIASES[value.trim().toLowerCase()]
  return alias ?? value.trim()
}

function labelsFor(part: string): string[] {
  return LANGUAGE_RULES.filter((rule) => rule.re.test(part)).map((rule) => rule.label)
}

function unique(values: string[]): string[] {
  const seen = new Set<string>()
  const out: string[] = []
  for (const value of values) {
    if (seen.has(value)) continue
    seen.add(value)
    out.push(value)
  }
  return out
}

function isOtherKey(key: string): boolean {
  const value = key.trim().toLowerCase()
  return value === 'інші' || value === 'інше' || value === 'other' || value === 'other / unknown' || value === 'unknown'
}

function asText(value: unknown): string | null {
  if (typeof value === 'string') {
    const trimmed = value.trim()
    return trimmed ? trimmed : null
  }
  return null
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value.replace(/\s/g, '').replace(',', '.'))
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function pickText(raw: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const text = asText(raw[key])
    if (text) return text
  }
  return null
}

export function normalizeCatalogRow(raw: Record<string, unknown>): PublicRecord | null {
  const id = asText(raw.id)
  const name = pickText(raw, ['name', 'title'])
  if (!id || !name) return null

  const groupBucket = languageBucket(raw)
  const platformBucket = platformBucketFrom(raw)
  const entity = asText(raw.entity_type)
  const city = asText(raw.city)
  const cityRegion = pickText(raw, ['city_region', 'cityRegion'])

  const category = pickText(raw, ['category']) ?? ''
  return {
    id,
    category,
    categoryLabel: pickText(raw, ['category_label', 'categoryLabel']) ?? category,
    subcategory: asText(raw.subcategory),
    name,
    description: pickText(raw, ['description', 'short_description']),
    organization: asText(raw.organization),
    country: asText(raw.country),
    city,
    cityRegion,
    place: cityRegion || city,
    languageCommunity: asText(raw.language_community),
    website: asText(raw.website),
    sourceUrl: pickText(raw, ['source_url', 'sourceUrl']),
    detailsLink: pickText(raw, ['details_link', 'detailsLink']),
    source: asText(raw.source),
    publishedDate: pickText(raw, ['published_date', 'publishedDate']),
    status: asText(raw.status),
    priority: asText(raw.priority),
    reliability: asNumber(raw.reliability),
    potential: asNumber(raw.potential),
    partnerType: pickText(raw, ['partner_type', 'partnerType']),
    ratingScore: asNumber(raw.rating_score ?? raw.ratingScore),
    audienceSize: asNumber(raw.audience_size ?? raw.audienceSize),
    audienceSource: pickText(raw, ['audience_source', 'audienceSource']),
    languageGroup: groupBucket.value,
    languageGroupLabel: groupBucket.label,
    nationality: asText(raw.nationality),
    platform: platformBucket.value,
    entityType: entity,
    dateAdded: pickText(raw, ['date_added', 'dateAdded']),
    lastUpdated: pickText(raw, ['last_updated', 'lastUpdated']),
    lastChecked: pickText(raw, ['last_checked', 'last_verified', 'lastChecked']),
    syncedAt: pickText(raw, ['synced_at', 'syncedAt']),
    languageFromColumn: groupBucket.fromColumn,
    platformFromColumn: platformBucket.fromColumn,
    relationType: isRelation(raw.relation_type) ? raw.relation_type : null,
    suggestedRelationType: isRelation(raw.suggested_relation_type) ? raw.suggested_relation_type : null,
    relationReason: asText(raw.relation_reason),
    bestChannel: isChannel(raw.best_channel) ? raw.best_channel : null,
    channelReason: asText(raw.channel_reason),
    geoScope: asText(raw.geo_scope) ?? asText(raw.country),
    languageGroupLabelSk: asText(raw.language_group_label_sk),
  }
}

function languageBucket(raw: Record<string, unknown>): { value: string; label: string | null; fromColumn: boolean } {
  if (!('language_group' in raw)) {
    const derived = deriveLanguageGroup(asText(raw.language_community), asText(raw.nationality))
    return { value: derived, label: displayLabel(derived), fromColumn: false }
  }
  const text = asText(raw.language_group)
  const key = languageKey(text)
  const columnLabel = asText(raw.language_group_label)
  const label = isNonCommunity(key) ? NON_COMMUNITY_LABEL : columnLabel ?? displayLabel(key)
  return { value: key, label, fromColumn: text != null }
}

function platformBucketFrom(raw: Record<string, unknown>): { value: string; fromColumn: boolean } {
  if (!('platform' in raw)) {
    return {
      value: derivePlatform({
        subcategory: asText(raw.subcategory),
        website: asText(raw.website),
        sourceUrl: pickText(raw, ['source_url', 'sourceUrl']),
      }),
      fromColumn: false,
    }
  }
  const text = asText(raw.platform)
  return { value: platformKey(text), fromColumn: text != null }
}

export function parseFacet(raw: Record<string, unknown>): FacetRow | null {
  const language = asText(raw.language_group) ?? 'інші'
  const platform = asText(raw.platform) ?? 'інші'
  const n = asNumber(raw.n)
  if (n == null) return null
  return { language_group: language, platform, n }
}

function countRows(rows: PublicRecord[], key: 'languageGroup' | 'platform'): CatalogCard[] {
  const counts = new Map<string, number>()
  for (const row of rows) {
    const bucket = row[key]
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1)
  }
  return [...counts.entries()].map(([bucket, count]) => ({ key: bucket, label: displayLabel(bucket), count }))
}

function sumFacets(facets: Array<{ key: string; n: number }>): CatalogCard[] {
  const counts = new Map<string, number>()
  for (const facet of facets) counts.set(facet.key, (counts.get(facet.key) ?? 0) + facet.n)
  return [...counts.entries()].map(([key, count]) => ({ key, label: displayLabel(key), count }))
}

export function sortFacetCards(cards: CatalogCard[], order: readonly string[]): CatalogCard[] {
  const rank = new Map(order.map((key, index) => [key.toLowerCase(), index]))
  return [...cards].sort((a, b) => {
    const aOther = isOtherKey(a.key)
    const bOther = isOtherKey(b.key)
    if (aOther !== bOther) return aOther ? 1 : -1
    const aRank = rank.get(a.key.toLowerCase())
    const bRank = rank.get(b.key.toLowerCase())
    if (aRank != null && bRank != null && aRank !== bRank) return aRank - bRank
    if (aRank != null && bRank == null) return -1
    if (aRank == null && bRank != null) return 1
    if (a.count !== b.count) return b.count - a.count
    return a.label.localeCompare(b.label, 'uk')
  })
}

function isPlaceholderFacet(facet: FacetRow): boolean {
  const group = facet.language_group.trim().toLowerCase()
  const platform = facet.platform.trim().toLowerCase()
  const groupBlank = group === '' || group === 'other' || group === 'other / unknown' || group === 'unknown'
  const platformBlank = platform === '' || platform === 'other' || platform === 'other / unknown' || platform === 'unknown'
  return groupBlank && platformBlank
}

function facetsUseful(facets: FacetRow[]): boolean {
  return facets.some((facet) => !isPlaceholderFacet(facet))
}

function groupLabel(key: string, rows: PublicRecord[]): string {
  if (isNonCommunity(key)) return NON_COMMUNITY_LABEL
  const labeled = rows.find((row) => row.languageGroup === key && row.languageGroupLabel)
  return labeled?.languageGroupLabel || displayLabel(key)
}

function labelGroups(cards: CatalogCard[], rows: PublicRecord[]): CatalogCard[] {
  return cards.map((card) => ({ ...card, label: groupLabel(card.key, rows) }))
}

function labelPlatforms(cards: CatalogCard[]): CatalogCard[] {
  return cards.map((card) => ({ ...card, label: displayLabel(card.key) }))
}

function partitionGroups(cards: CatalogCard[]): { groups: CatalogCard[]; aside: CatalogCard | null } {
  return {
    groups: cards.filter((card) => !isNonCommunity(card.key)),
    aside: cards.find((card) => isNonCommunity(card.key)) ?? null,
  }
}

export function buildCatalogModel(rows: PublicRecord[], facets: FacetRow[] | null): CatalogModel {
  if (facets && facets.length > 0 && facetsUseful(facets)) {
    const normalized = facets.map((facet) => ({
      languageGroup: languageKey(facet.language_group),
      platform: platformKey(facet.platform),
      n: facet.n,
    }))
    const counted = labelGroups(
      sortFacetCards(
        sumFacets(normalized.map((facet) => ({ key: facet.languageGroup, n: facet.n }))),
        GROUP_ORDER,
      ),
      rows,
    )
    const byGroup = new Map<string, CatalogCard[]>()
    for (const group of counted) {
      const subset = normalized.filter((facet) => facet.languageGroup === group.key)
      byGroup.set(
        group.key,
        labelPlatforms(
          sortFacetCards(
            sumFacets(subset.map((facet) => ({ key: facet.platform, n: facet.n }))),
            PLATFORM_ORDER,
          ),
        ),
      )
    }
    const { groups, aside } = partitionGroups(counted)
    return { groups, aside, platformsFor: (group) => byGroup.get(group) ?? [], basis: 'catalog_facets' }
  }
  const counted = labelGroups(sortFacetCards(countRows(rows, 'languageGroup'), GROUP_ORDER), rows)
  const { groups, aside } = partitionGroups(counted)
  return {
    groups,
    aside,
    platformsFor: (group) =>
      labelPlatforms(
        sortFacetCards(
          countRows(
            rows.filter((row) => row.languageGroup === group),
            'platform',
          ),
          PLATFORM_ORDER,
        ),
      ),
    basis: 'client',
  }
}

export function compareCatalog(a: PublicRecord, b: PublicRecord): number {
  const aRating = a.ratingScore
  const bRating = b.ratingScore
  if (aRating != null || bRating != null) {
    if (aRating == null) return 1
    if (bRating == null) return -1
    if (aRating !== bRating) return bRating - aRating
  }
  const byPriority = priorityWeight(b.priority) - priorityWeight(a.priority)
  if (byPriority) return byPriority
  const byPotential = (b.potential ?? Number.NEGATIVE_INFINITY) - (a.potential ?? Number.NEGATIVE_INFINITY)
  if (byPotential) return byPotential
  return a.name.localeCompare(b.name, 'uk')
}

export function sortCatalog(rows: PublicRecord[]): PublicRecord[] {
  return [...rows].sort(compareCatalog)
}

function haystack(row: PublicRecord): string {
  return [
    row.name,
    row.description,
    row.organization,
    row.city,
    row.cityRegion,
    row.place,
    row.audienceSource,
    row.country,
    row.category,
    row.categoryLabel,
    row.subcategory,
    row.nationality,
    row.languageGroup,
    row.languageGroupLabel,
    row.languageCommunity,
    row.platform,
    row.entityType,
    row.status,
    row.id,
  ]
    .filter(Boolean)
    .join('\n')
    .toLowerCase()
}

export function filterCatalog(rows: PublicRecord[], filters: CatalogListFilters): PublicRecord[] {
  const query = filters.q.trim().toLowerCase()
  return rows.filter((row) => {
    if (filters.city && (row.place ?? '') !== filters.city) return false
    if (filters.country && (row.geoScope ?? '') !== filters.country) return false
    if (filters.relation && (row.relationType ?? '') !== filters.relation) return false
    if (filters.status && normStatus(row.status) !== normStatus(filters.status)) return false
    if (filters.category && row.category !== filters.category) return false
    if (query && !haystack(row).includes(query)) return false
    return true
  })
}

export function distinctText(rows: PublicRecord[], key: 'place' | 'country' | 'city' | 'geoScope'): string[] {
  const values = new Set<string>()
  for (const row of rows) {
    const value = row[key]
    if (value) values.add(value)
  }
  return [...values].sort((a, b) => a.localeCompare(b, 'uk'))
}

export function distinctStatuses(rows: PublicRecord[]): string[] {
  const values = new Set<string>()
  for (const row of rows) {
    const value = normStatus(row.status)
    if (value) values.add(value)
  }
  return [...values].sort((a, b) => a.localeCompare(b, 'uk'))
}

export function distinctCategories(rows: PublicRecord[]): Array<{ value: string; label: string }> {
  const labels = new Map<string, string>()
  for (const row of rows) {
    if (!row.category || labels.has(row.category)) continue
    labels.set(row.category, row.categoryLabel || row.category)
  }
  return [...labels.entries()]
    .map(([value, label]) => ({ value, label }))
    .sort((a, b) => a.label.localeCompare(b.label, 'uk'))
}
