import type { Locale } from './locales.ts'
import type { Channel, Direction, LogChannel, OutreachStatus, Relation, TemplateId } from '../lib/crm.ts'

type CrmMessages = {
  relation: Record<Relation, string>
  relationPlural: Record<Relation, string>
  relationHelp: Record<Relation, string>
  status: Record<OutreachStatus, string>
  statusHelp: Record<OutreachStatus, string>
  channel: Record<LogChannel, string>
  direction: Record<Direction, string>
  template: Record<TemplateId, string>
  geo: Record<string, string>
  nav: { pipeline: string; activity: string; help: string; account: string; work: string }
  f: {
    relation: string
    relationReason: string
    bestChannel: string
    channelReason: string
    geo: string
    outreach: string
    assigned: string
    nobody: string
    nextStep: string
    contactedAt: string
    updatedBy: (who: string, when: string) => string
    mine: string
    everyone: string
    person: string
    suggested: string
    direction: string
  }
  work: {
    title: string
    signInToEdit: string
    noAccess: string
    save: string
    saving: string
    saved: string
    prepare: string
    log: string
    logEmpty: string
    addEntry: string
    summary: string
    summaryHint: string
    add: string
    adding: string
    noSend: string
  }
  letter: {
    title: string
    template: string
    lang: string
    sender: string
    contact: string
    contactHint: string
    date: string
    copy: string
    copied: string
    markDraft: string
    close: string
    rules: string
  }
  pipeline: {
    title: string
    meta: string
    empty: string
    signIn: string
    open: string
  }
  activity: { title: string; meta: string; empty: string; event: (e: string, o: string | null, n: string | null) => string }
  help: { title: string; meta: string; relations: string; statuses: string; channels: string; geo: string; privacy: string; privacyBody: string; strategy: string }
  account: {
    title: string
    meta: string
    password: string
    password2: string
    save: string
    saved: string
    mismatch: string
    short: string
    passwordLogin: string
    passwordField: string
    signIn: string
    or: string
    passwordHint: string
  }
}

const uk: CrmMessages = {
  relation: {
    client: 'Потенційний клієнт',
    partner: 'Партнер',
    media: 'Співпраця (медіа/реклама)',
    job: 'Робота / фриланс',
    info: 'Джерело інформації',
  },
  relationPlural: {
    client: 'Потенційні клієнти',
    partner: 'Партнери',
    media: 'Співпраця',
    job: 'Робота / фриланс',
    info: 'Джерела інформації',
  },
  relationHelp: {
    client: 'Спільноти (групи Facebook, Telegram-чати), де учасники самі є аудиторією FinanzHelper. Мета — дозвіл адміністратора на інформаційний допис.',
    partner: 'Організації громади, консультанти, кадрові агенції. Мета — спільні інфо-заходи, памʼятки, взаємні рекомендації.',
    media: 'Канали, портали, блогери з аудиторією. Мета — запит умов реклами або гостьового матеріалу.',
    job: 'Вакансії та кадрові агенції як джерело роботи / фрилансу.',
    info: 'Статистика, довідники, офіційні установи, конкуренти — лише читаємо, не звертаємося.',
  },
  status: {
    new: 'Новий',
    selected: 'Обрано',
    draft_ready: 'Лист підготовлено',
    contacted: 'Написали',
    replied: 'Відповіли',
    agreed: 'Домовлено',
    declined: 'Відмова',
  },
  statusHelp: {
    new: 'Запис ще ніхто не взяв.',
    selected: 'Взяли в роботу, але ще не писали — потрібна дія.',
    draft_ready: 'Текст готовий, чекає перевірки й надсилання людиною.',
    contacted: 'Повідомлення надіслано, чекаємо відповіді.',
    replied: 'Є відповідь — внесіть її в журнал і визначте наступний крок.',
    agreed: 'Є домовленість (допис, захід, партнерство).',
    declined: 'Відмова, немає відповіді після нагадування або прохання не писати.',
  },
  channel: {
    email: 'Email',
    telegram: 'Telegram',
    facebook: 'Facebook Messenger',
    phone: 'Телефон',
    form: 'Форма на сайті',
    instagram: 'Instagram DM',
    meeting: 'Зустріч',
    other: 'Інше',
  },
  direction: { out: 'Ми написали', in: 'Нам відповіли', note: 'Нотатка' },
  template: {
    community: 'Адміністратор спільноти',
    media: 'Медіа / реклама',
    partner_org: 'Організація громади',
    consultant: 'Консультант',
    agency: 'Кадрова агенція',
    followup: 'Нагадування',
  },
  geo: {
    Germany: 'Німеччина',
    'Online (Germany)': 'Онлайн (для Німеччини)',
    Slovakia: 'Словаччина',
    Czechia: 'Чехія',
    'Czechia/Slovakia': 'Чехія / Словаччина',
    Poland: 'Польща',
    Austria: 'Австрія',
    Switzerland: 'Швейцарія',
    'Europe-wide': 'Вся Європа',
    'Online / global': 'Онлайн / глобально',
    USA: 'США (віддалено)',
    'Not applicable': 'Не застосовується',
    Unknown: 'Невідомо',
  },
  nav: { pipeline: 'Робота з контактами', activity: 'Хто кому писав', help: 'Пояснення', account: 'Мій пароль', work: 'Команда' },
  f: {
    relation: 'Тип звʼязку',
    relationReason: 'Чому такий тип',
    bestChannel: 'Найкращий канал',
    channelReason: 'Чому цей канал',
    geo: 'Країна / охоплення',
    outreach: 'Статус роботи',
    assigned: 'Відповідальний',
    nobody: 'Не призначено',
    nextStep: 'Наступний крок',
    contactedAt: 'Написали',
    updatedBy: (who, when) => `Змінив(ла) ${who} · ${when}`,
    mine: 'Мої',
    everyone: 'Усі',
    person: 'Людина',
    suggested: 'запропоновано автоматично',
    direction: 'Що сталося',
  },
  work: {
    title: 'Робота з контактом',
    signInToEdit: 'Увійдіть, щоб відмічати тип, статус і вести журнал листування.',
    noAccess: 'Ваш обліковий запис не має ролі команди. Зверніться до власника.',
    save: 'Зберегти',
    saving: 'Збереження…',
    saved: 'Збережено',
    prepare: 'Підготувати лист',
    log: 'Журнал листування',
    logEmpty: 'Записів ще немає.',
    addEntry: 'Додати запис',
    summary: 'Текст або короткий зміст',
    summaryHint: 'Вставте надісланий лист або отриману відповідь. Видно лише команді.',
    add: 'Додати',
    adding: 'Додавання…',
    noSend: 'Портал нічого не надсилає: копіюєте текст і надсилаєте самі.',
  },
  letter: {
    title: 'Підготувати лист',
    template: 'Шаблон',
    lang: 'Мова листа',
    sender: 'Ваше імʼя',
    contact: 'Імʼя адресата',
    contactHint: 'Якщо невідоме — залиште порожнім',
    date: 'Дата першого листа',
    copy: 'Копіювати текст',
    copied: 'Скопійовано',
    markDraft: 'Позначити «Лист підготовлено»',
    close: 'Закрити',
    rules: 'Перед надсиланням: перевірте правила групи, пишіть лише на робочі контакти організацій, одне повідомлення і максимум одне нагадування (UWG / DSGVO).',
  },
  pipeline: {
    title: 'Робота з контактами',
    meta: 'Записи за типом звʼязку, згруповані за статусом. Колір: червоний — потрібна дія, жовтий — лист готовий, синій — чекаємо, зелений — відповіли / домовлено, сірий — відмова.',
    empty: 'Порожньо',
    signIn: 'Розділ доступний лише команді після входу.',
    open: 'Відкрити',
  },
  activity: {
    title: 'Хто кому писав',
    meta: 'Останні дії команди: зміни статусів, призначення, листи й відповіді.',
    empty: 'Дій ще немає.',
    event: (e, o, n) => {
      if (e === 'created') return `взяв(ла) в роботу (${n ?? ''})`
      if (e === 'status') return `статус: ${o ?? '—'} → ${n ?? '—'}`
      if (e === 'relation_type') return `тип: ${o ?? '—'} → ${n ?? '—'}`
      if (e === 'assigned_to') return `відповідальний: ${o ?? '—'} → ${n ?? '—'}`
      if (e === 'next_step') return `наступний крок: ${n ?? '—'}`
      if (e === 'interaction_out') return `написав(ла) (${o ?? ''}): ${n ?? ''}`
      if (e === 'interaction_in') return `отримав(ла) відповідь (${o ?? ''}): ${n ?? ''}`
      if (e === 'interaction_note') return `нотатка: ${n ?? ''}`
      return e
    },
  },
  help: {
    title: 'Пояснення',
    meta: 'Що означають типи, статуси, канали й країна в каталозі.',
    relations: 'Типи звʼязку',
    statuses: 'Статуси та кольори',
    channels: 'Канали звʼязку',
    geo: 'Країна / охоплення',
    privacy: 'Що бачать відвідувачі без входу',
    privacyBody: 'Без входу видно каталог і тип звʼязку. Статуси, відповідальні, журнал листування, нотатки й особисті контакти бачить лише команда після входу. Змінювати дані без входу неможливо.',
    strategy: 'Повна стратегія звʼязку з шаблонами — у документі «DATABASE — Стратегія звʼязку» на Google Drive.',
  },
  account: {
    title: 'Мій пароль',
    meta: 'Задайте пароль, щоб входити без листа (лист має ліміт кілька на годину).',
    password: 'Новий пароль',
    password2: 'Повторіть пароль',
    save: 'Зберегти пароль',
    saved: 'Пароль збережено. Тепер можна входити через email і пароль.',
    mismatch: 'Паролі не збігаються.',
    short: 'Мінімум 10 символів.',
    passwordLogin: 'Вхід з паролем',
    passwordField: 'Пароль',
    signIn: 'Увійти',
    or: 'або',
    passwordHint: 'Пароль задається після першого входу за посиланням з листа: меню «Мій пароль».',
  },
}

const sk: CrmMessages = {
  relation: {
    client: 'Potenciálny klient',
    partner: 'Partner',
    media: 'Spolupráca (médiá/reklama)',
    job: 'Práca / freelance',
    info: 'Zdroj informácií',
  },
  relationPlural: {
    client: 'Potenciálni klienti',
    partner: 'Partneri',
    media: 'Spolupráca',
    job: 'Práca / freelance',
    info: 'Zdroje informácií',
  },
  relationHelp: {
    client: 'Komunity (skupiny na Facebooku, Telegram chaty), ktorých členovia sú publikom FinanzHelper. Cieľ — súhlas správcu s informačným príspevkom.',
    partner: 'Komunitné organizácie, poradcovia, personálne agentúry. Cieľ — spoločné informačné podujatia, letáky, vzájomné odporúčania.',
    media: 'Kanály, portály, blogeri s publikom. Cieľ — zistiť podmienky reklamy alebo hosťovského článku.',
    job: 'Pracovné ponuky a agentúry ako zdroj práce / freelance.',
    info: 'Štatistiky, príručky, úrady, konkurenti — iba čítame, neoslovujeme.',
  },
  status: {
    new: 'Nový',
    selected: 'Vybraný',
    draft_ready: 'Správa pripravená',
    contacted: 'Napísali sme',
    replied: 'Odpovedali',
    agreed: 'Dohodnuté',
    declined: 'Odmietnuté',
  },
  statusHelp: {
    new: 'Záznam si ešte nikto nevzal.',
    selected: 'Vzatý do práce, ale ešte sme nepísali — treba konať.',
    draft_ready: 'Text je pripravený, čaká na kontrolu a odoslanie človekom.',
    contacted: 'Správa odoslaná, čakáme na odpoveď.',
    replied: 'Prišla odpoveď — zapíšte ju do denníka a určte ďalší krok.',
    agreed: 'Je dohoda (príspevok, podujatie, partnerstvo).',
    declined: 'Odmietnutie, bez odpovede po pripomenutí alebo žiadosť nepísať.',
  },
  channel: {
    email: 'E-mail',
    telegram: 'Telegram',
    facebook: 'Facebook Messenger',
    phone: 'Telefón',
    form: 'Formulár na webe',
    instagram: 'Instagram DM',
    meeting: 'Stretnutie',
    other: 'Iné',
  },
  direction: { out: 'Napísali sme', in: 'Odpovedali nám', note: 'Poznámka' },
  template: {
    community: 'Správca komunity',
    media: 'Médiá / reklama',
    partner_org: 'Komunitná organizácia',
    consultant: 'Poradca',
    agency: 'Personálna agentúra',
    followup: 'Pripomienka',
  },
  geo: {
    Germany: 'Nemecko',
    'Online (Germany)': 'Online (pre Nemecko)',
    Slovakia: 'Slovensko',
    Czechia: 'Česko',
    'Czechia/Slovakia': 'Česko / Slovensko',
    Poland: 'Poľsko',
    Austria: 'Rakúsko',
    Switzerland: 'Švajčiarsko',
    'Europe-wide': 'Celá Európa',
    'Online / global': 'Online / globálne',
    USA: 'USA (na diaľku)',
    'Not applicable': 'Neuplatňuje sa',
    Unknown: 'Neznáme',
  },
  nav: { pipeline: 'Práca s kontaktmi', activity: 'Kto komu písal', help: 'Vysvetlivky', account: 'Moje heslo', work: 'Tím' },
  f: {
    relation: 'Typ vzťahu',
    relationReason: 'Prečo tento typ',
    bestChannel: 'Najlepší kanál',
    channelReason: 'Prečo tento kanál',
    geo: 'Krajina / dosah',
    outreach: 'Stav práce',
    assigned: 'Zodpovedný',
    nobody: 'Nepriradené',
    nextStep: 'Ďalší krok',
    contactedAt: 'Napísali sme',
    updatedBy: (who, when) => `Zmenil(a) ${who} · ${when}`,
    mine: 'Moje',
    everyone: 'Všetci',
    person: 'Osoba',
    suggested: 'navrhnuté automaticky',
    direction: 'Čo sa stalo',
  },
  work: {
    title: 'Práca s kontaktom',
    signInToEdit: 'Prihláste sa, aby ste mohli označovať typ, stav a viesť denník komunikácie.',
    noAccess: 'Váš účet nemá rolu tímu. Obráťte sa na vlastníka.',
    save: 'Uložiť',
    saving: 'Ukladá sa…',
    saved: 'Uložené',
    prepare: 'Pripraviť správu',
    log: 'Denník komunikácie',
    logEmpty: 'Zatiaľ žiadne záznamy.',
    addEntry: 'Pridať záznam',
    summary: 'Text alebo stručný obsah',
    summaryHint: 'Vložte odoslanú správu alebo prijatú odpoveď. Vidí iba tím.',
    add: 'Pridať',
    adding: 'Pridáva sa…',
    noSend: 'Portál nič neodosiela: text skopírujete a odošlete sami.',
  },
  letter: {
    title: 'Pripraviť správu',
    template: 'Šablóna',
    lang: 'Jazyk správy',
    sender: 'Vaše meno',
    contact: 'Meno adresáta',
    contactHint: 'Ak ho nepoznáte, nechajte prázdne',
    date: 'Dátum prvej správy',
    copy: 'Kopírovať text',
    copied: 'Skopírované',
    markDraft: 'Označiť „Správa pripravená“',
    close: 'Zavrieť',
    rules: 'Pred odoslaním: skontrolujte pravidlá skupiny, píšte iba na pracovné kontakty organizácií, jedna správa a najviac jedna pripomienka (UWG / DSGVO).',
  },
  pipeline: {
    title: 'Práca s kontaktmi',
    meta: 'Záznamy podľa typu vzťahu, zoskupené podľa stavu. Farba: červená — treba konať, žltá — správa pripravená, modrá — čakáme, zelená — odpovedali / dohodnuté, sivá — odmietnuté.',
    empty: 'Prázdne',
    signIn: 'Sekcia je dostupná iba tímu po prihlásení.',
    open: 'Otvoriť',
  },
  activity: {
    title: 'Kto komu písal',
    meta: 'Posledné kroky tímu: zmeny stavu, priradenia, správy a odpovede.',
    empty: 'Zatiaľ žiadne kroky.',
    event: (e, o, n) => {
      if (e === 'created') return `vzal(a) do práce (${n ?? ''})`
      if (e === 'status') return `stav: ${o ?? '—'} → ${n ?? '—'}`
      if (e === 'relation_type') return `typ: ${o ?? '—'} → ${n ?? '—'}`
      if (e === 'assigned_to') return `zodpovedný: ${o ?? '—'} → ${n ?? '—'}`
      if (e === 'next_step') return `ďalší krok: ${n ?? '—'}`
      if (e === 'interaction_out') return `napísal(a) (${o ?? ''}): ${n ?? ''}`
      if (e === 'interaction_in') return `dostal(a) odpoveď (${o ?? ''}): ${n ?? ''}`
      if (e === 'interaction_note') return `poznámka: ${n ?? ''}`
      return e
    },
  },
  help: {
    title: 'Vysvetlivky',
    meta: 'Čo znamenajú typy, stavy, kanály a krajina v katalógu.',
    relations: 'Typy vzťahu',
    statuses: 'Stavy a farby',
    channels: 'Kanály',
    geo: 'Krajina / dosah',
    privacy: 'Čo vidia návštevníci bez prihlásenia',
    privacyBody: 'Bez prihlásenia je viditeľný katalóg a typ vzťahu. Stavy, zodpovedných, denník komunikácie, poznámky a osobné kontakty vidí iba tím po prihlásení. Bez prihlásenia nie je možné nič meniť.',
    strategy: 'Celá stratégia komunikácie so šablónami je v dokumente „DATABASE — Стратегія звʼязку“ na Google Drive.',
  },
  account: {
    title: 'Moje heslo',
    meta: 'Nastavte si heslo, aby ste sa mohli prihlasovať bez e-mailu (e-maily majú limit niekoľko za hodinu).',
    password: 'Nové heslo',
    password2: 'Zopakujte heslo',
    save: 'Uložiť heslo',
    saved: 'Heslo uložené. Teraz sa môžete prihlasovať e-mailom a heslom.',
    mismatch: 'Heslá sa nezhodujú.',
    short: 'Minimálne 10 znakov.',
    passwordLogin: 'Prihlásenie heslom',
    passwordField: 'Heslo',
    signIn: 'Prihlásiť sa',
    or: 'alebo',
    passwordHint: 'Heslo si nastavíte po prvom prihlásení cez odkaz z e-mailu: menu „Moje heslo“.',
  },
}

const CRM: Record<Locale, CrmMessages> = { uk, sk }

export function crmMessages(locale: Locale): CrmMessages {
  return CRM[locale] ?? uk
}

export function channelLabel(locale: Locale, channel: Channel | LogChannel | null | undefined): string {
  if (!channel) return '—'
  return crmMessages(locale).channel[channel] ?? channel
}

export function geoLabel(locale: Locale, geo: string | null | undefined): string {
  if (!geo) return '—'
  return crmMessages(locale).geo[geo] ?? geo
}

export type { CrmMessages }
