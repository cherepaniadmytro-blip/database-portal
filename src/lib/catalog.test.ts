import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  buildCatalogModel,
  canonicalGroup,
  compareCatalog,
  deriveLanguageGroup,
  derivePlatform,
  displayLabel,
  filterCatalog,
  normalizeCatalogRow,
  recordsLabel,
  sortFacetCards,
  type PublicRecord,
} from './catalog.ts'
import { buildCatalogHash, isAuthHash, parseCatalogHash } from './catalogRoute.ts'
import { appRedirectUrl } from './redirect.ts'

test('appRedirectUrl joins origin and the deployed base path', () => {
  assert.equal(
    appRedirectUrl('https://cherepaniadmytro-blip.github.io', '/database-portal/'),
    'https://cherepaniadmytro-blip.github.io/database-portal/',
  )
  assert.equal(appRedirectUrl('http://localhost:5173/', '/'), 'http://localhost:5173/')
  assert.equal(appRedirectUrl('http://127.0.0.1:4173', 'database-portal'), 'http://127.0.0.1:4173/database-portal/')
})

test('hash routes round-trip groups, platforms, filters and ids', () => {
  assert.deepEqual(parseCatalogHash(''), { kind: 'groups' })
  assert.deepEqual(parseCatalogHash('#/'), { kind: 'groups' })
  const platform = parseCatalogHash('#/g/%D1%87%D0%B5%D1%81%D1%8C%D0%BA%D1%96%20%2F%20%D1%81%D0%BB%D0%BE%D0%B2%D0%B0%D1%86%D1%8C%D0%BA%D1%96')
  assert.equal(platform.kind, 'platforms')
  if (platform.kind === 'platforms') assert.equal(platform.group, 'чеські / словацькі')

  const list = {
    kind: 'list' as const,
    group: 'українськомовні',
    platform: 'сайт/медіа',
    filters: { q: 'київ & co', city: 'Берлін', country: 'Germany', status: 'VERIFIED', category: 'Leads' },
  }
  const hash = buildCatalogHash(list)
  assert.equal(parseCatalogHash(hash).kind, 'list')
  assert.deepEqual(parseCatalogHash(hash), list)
  assert.match(hash, /%2F/)
  assert.doesNotMatch(hash.split('?')[0] ?? '', /сайт\/медіа/)

  const detail = buildCatalogHash({ ...list, kind: 'detail', id: 'SB-LEAD-0001' })
  const parsed = parseCatalogHash(detail)
  assert.equal(parsed.kind, 'detail')
  if (parsed.kind === 'detail') {
    assert.equal(parsed.id, 'SB-LEAD-0001')
    assert.equal(parsed.filters.q, 'київ & co')
  }
  assert.equal(buildCatalogHash({ kind: 'list', group: 'польські', platform: 'Facebook', filters: { q: '', city: '', country: '', status: '', category: '' } }).includes('?'), false)
})

test('auth callback hash is not a catalog route', () => {
  const hash = '#access_token=abc&refresh_token=def&type=magiclink'
  assert.equal(isAuthHash(hash), true)
  assert.deepEqual(parseCatalogHash(hash), { kind: 'groups' })
  assert.equal(isAuthHash('#/g/x'), false)
})

test('language groups prefer the community over the host country', () => {
  assert.equal(deriveLanguageGroup('Ukrainian', null), 'українськомовні')
  assert.equal(deriveLanguageGroup('UK', null), 'українськомовні')
  assert.equal(deriveLanguageGroup('Russian-speaking', null), 'російськомовні')
  assert.equal(deriveLanguageGroup('RU', null), 'російськомовні')
  assert.equal(deriveLanguageGroup('UK / RU', null), 'українськомовні / російськомовні')
  assert.equal(deriveLanguageGroup('Polish community', null), 'польські')
  assert.equal(deriveLanguageGroup('Arabic-speaking communities (not one citizenship)', null), 'арабські')
  assert.equal(deriveLanguageGroup('Turkish', null), 'турецькомовні')
  assert.equal(deriveLanguageGroup('German | Turkish community', null), 'турецькомовні')
  assert.equal(deriveLanguageGroup('Bulgarian', null), 'болгарські')
  assert.equal(deriveLanguageGroup('Czech/Slovak', null), 'чеські / словацькі')
  assert.equal(deriveLanguageGroup('SK', null), 'словацькі')
  assert.equal(deriveLanguageGroup('Romanian', null), 'румунські')
  assert.equal(deriveLanguageGroup('DE', null), 'німецькомовні')
  assert.equal(deriveLanguageGroup('Hungarian', null), 'угорські')
  assert.equal(deriveLanguageGroup('', null), 'інші')
  assert.equal(deriveLanguageGroup(null, null), 'інші')
})

test('platform derivation reads subcategory and links', () => {
  assert.equal(derivePlatform({ subcategory: 'Facebook — Facebook-група', website: 'https://www.facebook.com/x' }), 'Facebook')
  assert.equal(derivePlatform({ subcategory: 'Blogger / media — YouTube', website: 'https://www.youtube.com/watch?v=1' }), 'YouTube')
  assert.equal(derivePlatform({ subcategory: 'Blogger / media — Facebook, Website' }), 'Facebook')
  assert.equal(derivePlatform({ subcategory: 'Channel — Telegram-чат', website: 'https://t.me/example' }), 'Telegram')
  assert.equal(derivePlatform({ subcategory: 'Organization — NGO', website: 'https://example.org' }), 'організація')
  assert.equal(derivePlatform({ subcategory: 'Staffing / Zeitarbeit agency — Великі', website: 'https://example.de' }), 'агенція')
  assert.equal(derivePlatform({ subcategory: 'Consultant/broker tied to insurer' }), 'консультант')
  assert.equal(derivePlatform({ subcategory: 'Фін./податкові консультанти — Податковий консультант' }), 'консультант')
  assert.equal(derivePlatform({ subcategory: 'Blogger / media — Website', website: 'https://example.de' }), 'блогер')
  assert.equal(derivePlatform({ subcategory: 'Блогери/медіа — сайт', website: 'https://example.de' }), 'блогер')
  assert.equal(derivePlatform({ website: 'https://www.instagram.com/x' }), 'Instagram')
  assert.equal(derivePlatform({ website: 'https://www.tiktok.com/@x' }), 'TikTok')
  assert.equal(derivePlatform({ subcategory: 'Project', website: 'https://example.de' }), 'сайт/медіа')
  assert.equal(derivePlatform({ subcategory: 'Community size statistic (Destatis/AZR)' }), 'інші')
})

test('column values win over derivation and placeholders do not', () => {
  const filled = normalizeCatalogRow({
    id: '1',
    name: 'Канал',
    language_group: 'Ukrainian',
    language_group_label: 'Українськомовні',
    language_community: 'Polish',
    platform: 'youtube',
    website: 'https://facebook.com/x',
    subcategory: 'Organization — NGO',
    rating_score: '12',
    audience_size: 3400,
  })
  assert.ok(filled)
  assert.equal(filled?.languageGroup, 'Ukrainian')
  assert.equal(filled?.languageGroupLabel, 'Українськомовні')
  assert.equal(filled?.platform, 'YouTube')
  assert.equal(filled?.ratingScore, 12)
  assert.equal(filled?.audienceSize, 3400)
  assert.equal(filled?.languageFromColumn, true)
  assert.equal(filled?.platformFromColumn, true)

  const empty = normalizeCatalogRow({
    id: '2',
    title: 'Портал',
    language_group: 'Other / unknown',
    language_community: 'Polish',
    platform: null,
    subcategory: 'Facebook group — Спільнота',
    website: 'https://facebook.com/g',
    city: 'Берлін',
    short_description: 'опис',
  })
  assert.equal(empty?.name, 'Портал')
  assert.equal(empty?.languageGroup, 'Other / unknown')
  assert.equal(empty?.platform, 'Other')
  assert.equal(empty?.description, 'опис')
  assert.equal(empty?.city, 'Берлін')
  assert.equal(empty?.languageFromColumn, true)
  assert.equal(empty?.platformFromColumn, false)

  const legacy = normalizeCatalogRow({
    id: '3',
    name: 'Старий рядок',
    language_community: 'Polish',
    subcategory: 'Facebook group — Спільнота',
    website: 'https://facebook.com/g',
  })
  assert.equal(legacy?.languageGroup, 'польські')
  assert.equal(legacy?.platform, 'Facebook')
})

test('unclassified rows are counted on the client; classified rows use catalog_facets', () => {
  const derived = normalizeCatalogRow({
    id: 'a',
    name: 'A',
    language_community: 'Ukrainian',
    subcategory: 'Blogger / media — YouTube',
    website: 'https://youtube.com/a',
  })
  assert.ok(derived)
  const client = buildCatalogModel([derived], [{ language_group: 'Other / unknown', platform: 'Other', n: 1 }])
  assert.equal(client.basis, 'client')
  assert.deepEqual(
    client.groups.map((card) => card.key),
    ['українськомовні'],
  )
  assert.equal(client.platformsFor('українськомовні')[0]?.key, 'YouTube')

  const classified = normalizeCatalogRow({
    id: 'b',
    name: 'B',
    language_group: 'польські',
    platform: 'Telegram',
  })
  assert.ok(classified)
  const server = buildCatalogModel([classified], [
    { language_group: 'польські', platform: 'Telegram', n: 4 },
    { language_group: 'польські', platform: 'Facebook', n: 2 },
  ])
  assert.equal(server.basis, 'catalog_facets')
  assert.equal(server.groups[0]?.count, 6)
  assert.deepEqual(
    server.platformsFor('польські').map((card) => [card.key, card.count]),
    [
      ['Facebook', 2],
      ['Telegram', 4],
    ],
  )
})

test('ranking prefers rating_score, then priority, and keeps null ratings last', () => {
  const row = (partial: Partial<PublicRecord> & Pick<PublicRecord, 'id' | 'name'>): PublicRecord => ({
    category: '',
    categoryLabel: '',
    subcategory: null,
    description: null,
    organization: null,
    country: null,
    city: null,
    languageCommunity: null,
    website: null,
    sourceUrl: null,
    detailsLink: null,
    source: null,
    publishedDate: null,
    status: null,
    priority: null,
    reliability: null,
    potential: null,
    partnerType: null,
    ratingScore: null,
    audienceSize: null,
    languageGroup: 'інші',
    nationality: null,
    platform: 'інші',
    entityType: null,
    dateAdded: null,
    lastUpdated: null,
    lastChecked: null,
    syncedAt: null,
    languageFromColumn: false,
    platformFromColumn: false,
    ...partial,
  })
  const rows = [
    row({ id: '1', name: 'Без оцінки P3', priority: 'P3' }),
    row({ id: '2', name: 'Високий рейтинг', ratingScore: 2, priority: 'P3' }),
    row({ id: '3', name: 'Без оцінки P1', priority: 'P1' }),
    row({ id: '4', name: 'Найвищий', ratingScore: 9 }),
  ]
  assert.deepEqual(rows.slice().sort(compareCatalog).map((item) => item.id), ['4', '2', '3', '1'])
})

test('filters match city, status, category and search', () => {
  const base = normalizeCatalogRow({
    id: '1',
    name: 'Берлінський канал',
    city: 'Берлін',
    country: 'Germany',
    status: 'NEEDS REVIEW',
    category: 'Leads',
    category_label: 'Потенційні клієнти та ліди',
    language_group: 'українськомовні',
    platform: 'YouTube',
    description: 'новини для громади',
  })
  const other = normalizeCatalogRow({
    id: '2',
    name: 'Інший',
    city: 'Мюнхен',
    country: 'Germany',
    status: 'VERIFIED',
    category: 'Partners',
    language_group: 'українськомовні',
    platform: 'YouTube',
  })
  assert.ok(base && other)
  const rows = [base, other]
  assert.equal(filterCatalog(rows, { q: 'громади', city: '', country: '', status: '', category: '' }).length, 1)
  assert.equal(filterCatalog(rows, { q: '', city: 'Берлін', country: '', status: '', category: '' })[0]?.id, '1')
  assert.equal(filterCatalog(rows, { q: '', city: '', country: '', status: 'needs review', category: '' })[0]?.id, '1')
  assert.equal(filterCatalog(rows, { q: '', city: '', country: '', status: '', category: 'Partners' })[0]?.id, '2')
})

test('classifier labels use the same keys as catalog_facets', () => {
  const row = normalizeCatalogRow({
    id: '1',
    name: 'A',
    language_group: 'Ukrainian',
    language_group_label: 'Українськомовні',
    platform: 'Website',
    city: 'Germany-wide',
    city_region: 'Вся Німеччина',
    audience_source: 'record text (notes)',
    entity_type: 'Blogger / creator',
  })
  const blank = normalizeCatalogRow({
    id: '2',
    name: 'B',
    language_group: null,
    platform: 'Official statistics',
  })
  assert.equal(row?.languageGroup, 'Ukrainian')
  assert.equal(row?.languageGroupLabel, 'Українськомовні')
  assert.equal(row?.place, 'Вся Німеччина')
  assert.equal(row?.audienceSource, 'record text (notes)')
  assert.equal(row?.platform, 'Website')
  assert.equal(blank?.languageGroup, 'Not applicable')
  assert.equal(blank?.languageGroupLabel, 'Інше / не спільноти')
  assert.equal(blank?.platform, 'Official statistics')
  assert.ok(row && blank)
  const model = buildCatalogModel([row, blank], [
    { language_group: 'Ukrainian', platform: 'Website', n: 10 },
    { language_group: 'Not applicable', platform: 'Website', n: 171 },
    { language_group: 'Other', platform: 'Official statistics', n: 4 },
  ])
  assert.equal(model.basis, 'catalog_facets')
  assert.equal(model.groups.find((card) => card.key === 'Ukrainian')?.label, 'Українськомовні')
  assert.equal(model.groups.find((card) => card.key === 'Ukrainian')?.count, 10)
  assert.equal(model.groups.some((card) => card.key === 'Not applicable'), false)
  assert.equal(model.aside?.key, 'Not applicable')
  assert.equal(model.aside?.label, 'Інше / не спільноти')
  assert.equal(model.aside?.count, 171)
  assert.equal(model.platformsFor('Ukrainian')[0]?.key, 'Website')
  assert.equal(model.platformsFor('Ukrainian')[0]?.label, 'Сайт / медіа')
  assert.equal(model.platformsFor('Not applicable')[0]?.count, 171)
})

test('known groups stay in the requested order and інші is last', () => {
  const cards = sortFacetCards(
    [
      { key: 'інші', label: 'Інші', count: 50 },
      { key: 'угорські', label: 'Угорські', count: 40 },
      { key: 'румунські', label: 'Румунські', count: 3 },
      { key: 'українськомовні', label: 'Українськомовні', count: 2 },
    ],
    ['українськомовні', 'російськомовні', 'польські', 'арабські', 'турецькомовні', 'болгарські', 'словацькі', 'румунські'],
  )
  assert.deepEqual(
    cards.map((card) => card.key),
    ['українськомовні', 'румунські', 'угорські', 'інші'],
  )
  assert.equal(displayLabel('сайт/медіа'), 'Сайт / медіа')
  assert.equal(recordsLabel(1), 'запис')
  assert.equal(recordsLabel(2), 'записи')
  assert.equal(recordsLabel(5), 'записів')
  assert.equal(recordsLabel(11), 'записів')
  assert.equal(recordsLabel(22), 'записи')
  assert.equal(canonicalGroup('Russian-speaking'), 'російськомовні')
})
