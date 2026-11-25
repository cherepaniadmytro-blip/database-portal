import { DEFAULT_LOCALE, type Locale } from './locales.ts'
import { sk } from './sk.ts'
import { uk, type Messages } from './uk.ts'

/** Register a new language by adding it to LOCALES and to this map. */
const catalogs: Record<Locale, Messages> = { uk, sk }

export function getMessages(locale: Locale): Messages {
  return catalogs[locale] ?? catalogs[DEFAULT_LOCALE]
}

const UK_GROUPS: Record<string, string> = {
  українськомовні: 'Українськомовні',
  російськомовні: 'Російськомовні',
  польські: 'Польські',
  арабські: 'Арабські',
  турецькомовні: 'Турецькомовні',
  болгарські: 'Болгарські',
  словацькі: 'Словацькі',
  румунські: 'Румунські',
  чеські: 'Чеські',
  'чеські / словацькі': 'Чеські / словацькі',
  німецькомовні: 'Німецькомовні',
  угорські: 'Угорські',
  хорватські: 'Хорватські',
  сербські: 'Сербські',
  боснійські: 'Боснійські',
  курдські: 'Курдські',
  албанські: 'Албанські',
  італійські: 'Італійські',
  грецькі: 'Грецькі',
  данські: 'Данські',
  англомовні: 'Англомовні',
  сорбські: 'Сорбські',
  фризькі: 'Фризькі',
  "в'єтнамські": "В'єтнамські",
  іспанські: 'Іспанські',
  португальські: 'Португальські',
  китайські: 'Китайські',
  індійські: 'Індійські',
  перські: 'Перські',
  багатомовні: 'Багатомовні',
  'офіційна статистика': 'Офіційна статистика',
  'преса / радіо / тб': 'Преса / радіо / ТБ',
  Website: 'Сайт / медіа',
  'Official statistics': 'Офіційна статистика',
  'Print/Radio/TV': 'Преса / радіо / ТБ',
  Ukrainian: 'Українськомовні',
  'Russian-speaking': 'Російськомовні',
  Polish: 'Польськомовні',
  'Arabic-speaking': 'Арабомовні',
  Turkish: 'Турецькомовні',
  Bulgarian: 'Болгарські',
  'Czech/Slovak': 'Чеські / словацькі',
  Romanian: 'Румунськомовні',
  'German-speaking': 'Німецькомовні',
  Hungarian: 'Угорські',
  Kurdish: 'Курдські',
  Albanian: 'Албанські',
  Greek: 'Грецькі',
  Italian: 'Італійські',
  Vietnamese: "В'єтнамські",
  'Persian/Dari': 'Перськомовні (Іран, Афганістан)',
  Spanish: 'Іспаномовні',
  Portuguese: 'Португаломовні',
  Chinese: 'Китайські',
  Indian: 'Індійські',
  Multilingual: 'Багатомовні',
  'English / international': 'Англомовні / міжнародні',
  'BCMS (Croatian/Serbian/Bosnian)': 'Хорватські / сербські / боснійські',
  'хорватські / сербські / боснійські': 'Хорватські / сербські / боснійські',
  'Danish/Sorbian/Frisian minorities': 'Нацменшини (данці, сорби, фризи)',
  'данські / сорбські / фризькі': 'Нацменшини (данці, сорби, фризи)',
  'Not applicable': 'Інше / не спільноти',
  інші: 'Інші',
  Facebook: 'Facebook',
  YouTube: 'YouTube',
  Telegram: 'Telegram',
  Instagram: 'Instagram',
  TikTok: 'TikTok',
  LinkedIn: 'LinkedIn',
  'сайт/медіа': 'Сайт / медіа',
  блогер: 'Блогер',
  агенція: 'Агенція',
  організація: 'Організація',
  консультант: 'Консультант',
}

const SK_GROUPS: Record<string, string> = {
  українськомовні: 'Ukrajinsky hovoriace',
  російськомовні: 'Rusky hovoriace',
  польські: 'Poľské',
  арабські: 'Arabské',
  турецькомовні: 'Turecky hovoriace',
  болгарські: 'Bulharské',
  словацькі: 'Slovenské',
  румунські: 'Rumunské',
  чеські: 'České',
  'чеські / словацькі': 'České / slovenské',
  німецькомовні: 'Nemecky hovoriace',
  угорські: 'Maďarské',
  хорватські: 'Chorvátske',
  сербські: 'Srbské',
  боснійські: 'Bosniacke',
  курдські: 'Kurdské',
  албанські: 'Albánske',
  італійські: 'Talianské',
  грецькі: 'Grécke',
  данські: 'Dánske',
  англомовні: 'Anglicky hovoriace',
  сорбські: 'Lužickosrbské',
  фризькі: 'Frízske',
  "в'єтнамські": 'Vietnamské',
  іспанські: 'Španielske',
  португальські: 'Portugalské',
  китайські: 'Čínske',
  індійські: 'Indické',
  перські: 'Perzské',
  багатомовні: 'Viacjazyčné',
  'офіційна статистика': 'Oficiálna štatistika',
  'преса / радіо / тб': 'Tlač / rádio / TV',
  Website: 'Web / médiá',
  'Official statistics': 'Oficiálna štatistika',
  'Print/Radio/TV': 'Tlač / rádio / TV',
  Ukrainian: 'Ukrajinsky hovoriace',
  'Russian-speaking': 'Rusky hovoriace',
  Polish: 'Poľsky hovoriace',
  'Arabic-speaking': 'Arabsky hovoriace',
  Turkish: 'Turecky hovoriace',
  Bulgarian: 'Bulharské',
  'Czech/Slovak': 'České / slovenské',
  Romanian: 'Rumunsky hovoriace',
  'German-speaking': 'Nemecky hovoriace',
  Hungarian: 'Maďarské',
  Kurdish: 'Kurdské',
  Albanian: 'Albánske',
  Greek: 'Grécke',
  Italian: 'Talianské',
  Vietnamese: 'Vietnamské',
  'Persian/Dari': 'Perzsky hovoriace (Irán, Afganistan)',
  Spanish: 'Španielsky hovoriace',
  Portuguese: 'Portugalsky hovoriace',
  Chinese: 'Čínske',
  Indian: 'Indické',
  Multilingual: 'Viacjazyčné',
  'English / international': 'Anglicky hovoriace / medzinárodné',
  'BCMS (Croatian/Serbian/Bosnian)': 'Chorvátske / srbské / bosniacke',
  'хорватські / сербські / боснійські': 'Chorvátske / srbské / bosniacke',
  'Danish/Sorbian/Frisian minorities': 'Národnostné menšiny (Dáni, Lužickí Srbi, Frízi)',
  'данські / сорбські / фризькі': 'Národnostné menšiny (Dáni, Lužickí Srbi, Frízi)',
  'Not applicable': 'Iné / nie komunity',
  інші: 'Iné',
  Facebook: 'Facebook',
  YouTube: 'YouTube',
  Telegram: 'Telegram',
  Instagram: 'Instagram',
  TikTok: 'TikTok',
  LinkedIn: 'LinkedIn',
  'сайт/медіа': 'Web / médiá',
  блогер: 'Bloger',
  агенція: 'Agentúra',
  організація: 'Organizácia',
  консультант: 'Konzultant',
}

const GROUP_LABELS: Record<Locale, Record<string, string>> = {
  uk: UK_GROUPS,
  sk: SK_GROUPS,
}

const UK_ENTITIES: Record<string, string> = {
  'financial / tax consultant': 'Фінансовий / податковий консультант',
  'community organisation / ngo': 'Громадська організація',
  'staffing agency': 'Агенція з працевлаштування',
  'blogger / creator': 'Блогер',
  'facebook group': 'Група Facebook',
  'business opportunity': 'Бізнес-можливість',
  'statistics / research': 'Статистика / дослідження',
  'school / education': 'Школа / освіта',
  'telegram channel/chat': 'Telegram-канал / чат',
  'media / portal': 'Медіа / портал',
  knowledge: 'База знань',
  'religious organisation': 'Релігійна організація',
  source: 'Джерело',
  'tool / service': 'Інструмент / сервіс',
  'project / idea': 'Проєкт / ідея',
  other: 'Інше',
  'business association': 'Бізнес-асоціація',
  'consulate / official': 'Консульство / офіційна установа',
  'job / gig': 'Робота / підробіток',
}

const SK_ENTITIES: Record<string, string> = {
  'financial / tax consultant': 'Finančný / daňový poradca',
  'community organisation / ngo': 'Mimovládna / komunitná organizácia',
  'staffing agency': 'Agentúra práce',
  'blogger / creator': 'Bloger',
  'facebook group': 'Skupina na Facebooku',
  'business opportunity': 'Obchodná príležitosť',
  'statistics / research': 'Štatistika / výskum',
  'school / education': 'Škola / vzdelávanie',
  'telegram channel/chat': 'Telegram kanál / chat',
  'media / portal': 'Médiá / portál',
  knowledge: 'Vedomostná databáza',
  'religious organisation': 'Náboženská organizácia',
  source: 'Zdroj',
  'tool / service': 'Nástroj / služba',
  'project / idea': 'Projekt / nápad',
  other: 'Iné',
  'business association': 'Podnikateľské združenie',
  'consulate / official': 'Konzulát / oficiálna inštitúcia',
  'job / gig': 'Práca / brigáda',
}

const ENTITY_LABELS: Record<Locale, Record<string, string>> = {
  uk: UK_ENTITIES,
  sk: SK_ENTITIES,
}

function titleCase(key: string, locale: Locale): string {
  const lang = locale === 'sk' ? 'sk' : 'uk'
  return key
    .split(' / ')
    .map((part) => (part ? part.charAt(0).toLocaleUpperCase(lang) + part.slice(1) : part))
    .join(' / ')
}

export function catalogLabel(key: string, locale: Locale = DEFAULT_LOCALE): string | undefined {
  return GROUP_LABELS[locale]?.[key] ?? GROUP_LABELS[DEFAULT_LOCALE]?.[key]
}

export function formatCatalogLabel(key: string, locale: Locale = DEFAULT_LOCALE): string {
  return catalogLabel(key, locale) ?? titleCase(key, locale)
}

export function entityLabel(value: string, locale: Locale = DEFAULT_LOCALE): string {
  const needle = value.trim().toLowerCase()
  return ENTITY_LABELS[locale]?.[needle] ?? ENTITY_LABELS[DEFAULT_LOCALE]?.[needle] ?? value
}

/** Slavic plural: 1 / 2–4 / 5+ with teen exceptions. */
export function recordsWord(count: number, locale: Locale = DEFAULT_LOCALE): string {
  const t = getMessages(locale).records
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return t.one
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return t.few
  return t.many
}

export type { Messages } from './uk.ts'
export { uk } from './uk.ts'
export { sk } from './sk.ts'
