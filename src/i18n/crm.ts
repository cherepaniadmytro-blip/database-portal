import type { Locale } from './locales.ts'
import type { Channel, Direction, LogChannel, OutreachStatus, Relation, TemplateId, WorkflowMark } from '../lib/crm.ts'

type CrmMessages = {
  relation: Record<Relation, string>
  relationPlural: Record<Relation, string>
  relationHelp: Record<Relation, string>
  status: Record<OutreachStatus, string>
  statusHelp: Record<OutreachStatus, string>
  marks: Record<WorkflowMark, string>
  marksHelp: Record<WorkflowMark, string>
  channel: Record<LogChannel, string>
  direction: Record<Direction, string>
  template: Record<TemplateId, string>
  geo: Record<string, string>
  nav: { pipeline: string; stats: string; activity: string; help: string; account: string; work: string }
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
    unassigned: string
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
    takeWork: string
    takeOver: string
    youWork: string
    workingWith: (who: string) => string
    relationTicksHint: string
    movedToTab: (tab: string) => string
    openTab: string
    stageLabel: string
    quickMarksLabel: string
    statusHistoryTitle: string
    statusHistoryEmpty: string
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
    showNew: (count: number) => string
  }
  stats: {
    title: string
    meta: string
    kpiInWork: string
    kpiLetters: string
    kpiReplies: string
    kpiWorking: string
    teamTableTitle: string
    member: string
    taken: string
    lettersOut: string
    repliesIn: string
    notesCount: string
    unassignedRow: string
    totalRow: string
    marksCol: string
    perRecordTitle: string
    perRecordMeta: string
    searchPlaceholder: string
    allDirections: string
    allChannels: string
    channelLabel: string
    who: string
    toWhom: string
    what: string
    when: string
    emptyInteractions: string
    refresh: string
    groupByRecord: string
  }
  activity: { title: string; meta: string; empty: string; refresh: string; event: (e: string, o: string | null, n: string | null) => string }
  help: {
    title: string
    meta: string
    relations: string
    statuses: string
    marks: string
    channels: string
    geo: string
    privacy: string
    privacyBody: string
    strategy: string
  }
  account: {
    title: string
    meta: string
    profileSection: string
    displayName: string
    displayNamePlaceholder: string
    displayNameHint: string
    displayNameSave: string
    displayNameSaved: string
    passwordSection: string
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
    started: 'Почав працювати',
    reviewed: 'Переглянув',
    contacted: 'Написав лист',
    replied: 'Відповів',
    working: 'Працюємо',
    declined: 'Відмова / не актуально',
  },
  statusHelp: {
    new: 'Запис ще ніхто не взяв у роботу.',
    started: 'Взяли в роботу, відкрили запис / спільноту, ще вивчаємо.',
    reviewed: 'Переглянули групу або сайт, оцінили умови й підготували текст.',
    contacted: 'Лист або повідомлення надіслано, чекаємо відповіді.',
    replied: 'Отримали відповідь — додайте її в журнал і визначте наступний крок.',
    working: 'Є домовленість і активна співпраця (допис, захід, партнерство).',
    declined: 'Відмова, не актуально, правила забороняють або без відповіді.',
  },
  marks: {
    joined_group: 'Зайшов у групу',
    letter_sent: 'Лист надіслано',
    called: 'Дзвінок',
    in_telegram: 'В Telegram',
  },
  marksHelp: {
    joined_group: 'Вже зайшли в групу / чат або подали заявку на вступ.',
    letter_sent: 'Лист або повідомлення вже надіслано адміну чи контакту.',
    called: 'Був телефонний дзвінок або спроба звʼязку телефоном.',
    in_telegram: 'Знайшли або законтактували в Telegram.',
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
  nav: {
    pipeline: 'Робота з контактами',
    stats: 'Статистика',
    activity: 'Хто кому писав',
    help: 'Пояснення',
    account: 'Мій профіль',
    work: 'Команда',
  },
  f: {
    relation: 'Тип звʼязку',
    relationReason: 'Чому такий тип',
    bestChannel: 'Найкращий канал',
    channelReason: 'Чому цей канал',
    geo: 'Країна / охоплення',
    outreach: 'Статус роботи',
    assigned: 'Хто працює',
    nobody: 'Не призначено',
    nextStep: 'Наступний крок',
    contactedAt: 'Написали',
    updatedBy: (who, when) => `Змінив(ла) ${who} · ${when}`,
    mine: 'Мої',
    everyone: 'Усі',
    unassigned: 'Без відповідального',
    person: 'Людина',
    suggested: 'запропоновано автоматично',
    direction: 'Що сталося',
  },
  work: {
    title: 'Робота з контактом',
    signInToEdit: 'Увійдіть, щоб відмічати тип, статус, галочки й вести журнал листування.',
    noAccess: 'Ваш обліковий запис не має ролі команди. Зверніться до власника.',
    save: 'Зберегти',
    saving: 'Збереження…',
    saved: 'Збережено',
    prepare: 'Підготувати лист',
    log: 'Журнал листування',
    logEmpty: 'Записів листування ще немає.',
    addEntry: 'Додати запис у журнал',
    summary: 'Текст або короткий зміст',
    summaryHint: 'Вставте надісланий лист або отриману відповідь. Видно лише команді.',
    add: 'Додати',
    adding: 'Додавання…',
    noSend: 'Портал нічого не надсилає: копіюєте текст і надсилаєте самі.',
    takeWork: 'Беру в роботу',
    takeOver: 'Перейняти в роботу',
    youWork: 'Ви працюєте з цим записом',
    workingWith: (who) => `Працює: ${who}`,
    relationTicksHint: 'Позначте тип — запис одразу переноситься у відповідну вкладку розділу «Робота з контактами».',
    movedToTab: (tab) => `У вкладці «${tab}»`,
    openTab: 'Відкрити вкладку →',
    stageLabel: 'Етап роботи (натисніть для зміни)',
    quickMarksLabel: 'Швидкі галочки',
    statusHistoryTitle: 'Історія статусів та відповідальних',
    statusHistoryEmpty: 'Змін статусу ще не зафіксовано.',
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
    markDraft: 'Зберегти чернетку й позначити «Переглянув»',
    close: 'Закрити',
    rules: 'Перед надсиланням: перевірте правила групи, пишіть лише на робочі контакти організацій, одне повідомлення і максимум одне нагадування (UWG / DSGVO).',
  },
  pipeline: {
    title: 'Робота з контактами',
    meta: 'Записи за типом звʼязку, згруповані за етапами. Колір: червоний — почав працювати, помаранчевий — переглянув, жовтий — написав лист, синій — відповів, зелений — працюємо, сірий — відмова.',
    empty: 'Порожньо',
    signIn: 'Розділ доступний лише команді після входу.',
    open: 'Відкрити',
    showNew: (count) => `Показувати «Нові» (${count})`,
  },
  stats: {
    title: 'Статистика команди',
    meta: 'Скільки записів взяв у роботу кожен учасник, по етапах, надіслані листи, відповіді та історія листування по записах.',
    kpiInWork: 'Взято в роботу',
    kpiLetters: 'Написали листів',
    kpiReplies: 'Отримали відповідей',
    kpiWorking: 'Працюємо разом',
    teamTableTitle: 'Показники по кожному учаснику команди',
    member: 'Учасник',
    taken: 'Взято',
    lettersOut: 'Листів надісл.',
    repliesIn: 'Відповідей',
    notesCount: 'Нотаток',
    unassignedRow: 'Без відповідального',
    totalRow: 'Разом',
    marksCol: 'Галочки',
    perRecordTitle: 'Історія по записах: хто кому що писав',
    perRecordMeta: 'Повна історія звернень і відповідей по кожному контакту чи групі.',
    searchPlaceholder: 'Пошук за назвою запису, автором або текстом',
    allDirections: 'Усі напрямки',
    allChannels: 'Усі канали',
    channelLabel: 'Канал',
    who: 'Хто',
    toWhom: 'Кому (запис)',
    what: 'Що написано / відповідь',
    when: 'Коли',
    emptyInteractions: 'Записів листування за цими фільтрами ще немає.',
    refresh: 'Оновити',
    groupByRecord: 'Згрупувати по записах',
  },
  activity: {
    title: 'Хто кому писав',
    meta: 'Стрічка всіх дій команди: взяття в роботу, зміни статусів, галочки, листи й відповіді.',
    empty: 'Дій ще немає.',
    refresh: 'Оновити',
    event: (e, o, n) => {
      if (e === 'created') return `взяв(ла) в роботу (${n ?? ''})`
      if (e === 'status') return `статус: ${o ?? '—'} → ${n ?? '—'}`
      if (e === 'relation_type') return `тип: ${o ?? '—'} → ${n ?? '—'}`
      if (e === 'assigned_to') return `відповідальний: ${o ?? '—'} → ${n ?? '—'}`
      if (e === 'marks') return `галочки: ${o ?? '—'} → ${n ?? '—'}`
      if (e === 'next_step') return `наступний крок: ${n ?? '—'}`
      if (e === 'interaction_out') return `написав(ла) (${o ?? ''}): ${n ?? ''}`
      if (e === 'interaction_in') return `отримав(ла) відповідь (${o ?? ''}): ${n ?? ''}`
      if (e === 'interaction_note') return `нотатка: ${n ?? ''}`
      return e
    },
  },
  help: {
    title: 'Пояснення',
    meta: 'Що означають типи, статуси, галочки, канали й країна в каталозі.',
    relations: 'Типи звʼязку (вкладки в роботі з контактами)',
    statuses: 'Статуси роботи та кольори',
    marks: 'Швидкі галочки',
    channels: 'Канали звʼязку',
    geo: 'Країна / охоплення',
    privacy: 'Що бачать відвідувачі без входу',
    privacyBody: 'Без входу видно каталог і тип звʼязку. Статуси, галочки, відповідальні, статистика, журнал листування, нотатки й особисті контакти бачить лише команда після входу. Змінювати дані без входу неможливо.',
    strategy: 'Повна стратегія звʼязку з шаблонами — у документі «DATABASE — Стратегія звʼязку» на Google Drive.',
  },
  account: {
    title: 'Мій профіль і пароль',
    meta: 'Вкажіть імʼя для команди та задайте пароль, щоб входити без листа (лист має ліміт кілька на годину).',
    profileSection: 'Імʼя для команди',
    displayName: 'Відображуване імʼя',
    displayNamePlaceholder: 'Наприклад: Samuel або Max',
    displayNameHint: 'Це імʼя бачать усі учасники команди на значках «Працює: …» та у статистиці.',
    displayNameSave: 'Зберегти імʼя',
    displayNameSaved: 'Імʼя оновлено. Тепер команда бачить його на всіх картках.',
    passwordSection: 'Пароль для входу',
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
    started: 'Začal(a) pracovať',
    reviewed: 'Prezrel(a)',
    contacted: 'Napísal(a) správu',
    replied: 'Odpovedal(a)',
    working: 'Pracujeme spolu',
    declined: 'Odmietnuté / neaktuálne',
  },
  statusHelp: {
    new: 'Záznam si ešte nikto nevzal do práce.',
    started: 'Vzatý do práce, otvorili sme záznam / skupinu a študujeme ho.',
    reviewed: 'Skontrolovali sme skupinu alebo web, pravidlá a pripravili text.',
    contacted: 'Správa alebo e-mail je odoslaný, čakáme na odpoveď.',
    replied: 'Prišla odpoveď — zapíšte ju do denníka a určte ďalší krok.',
    working: 'Dohoda je potvrdená a aktívne spolupracujeme (príspevok, podujatie, partnerstvo).',
    declined: 'Odmietnutie, neaktuálne, pravidlá to zakazujú alebo bez odpovede.',
  },
  marks: {
    joined_group: 'Vstúpil(a) do skupiny',
    letter_sent: 'Správa odoslaná',
    called: 'Telefonát',
    in_telegram: 'V Telegrame',
  },
  marksHelp: {
    joined_group: 'Už sme vstúpili do skupiny / chatu alebo poslali žiadosť o vstup.',
    letter_sent: 'Správa alebo e-mail už bol odoslaný správcovi alebo kontaktu.',
    called: 'Prebehol telefonát alebo pokus o telefonický kontakt.',
    in_telegram: 'Nájdený alebo kontaktovaný cez Telegram.',
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
  nav: {
    pipeline: 'Práca s kontaktmi',
    stats: 'Štatistika',
    activity: 'Kto komu písal',
    help: 'Vysvetlivky',
    account: 'Môj profil',
    work: 'Tím',
  },
  f: {
    relation: 'Typ vzťahu',
    relationReason: 'Prečo tento typ',
    bestChannel: 'Najlepší kanál',
    channelReason: 'Prečo tento kanál',
    geo: 'Krajina / dosah',
    outreach: 'Stav práce',
    assigned: 'Kto na tom pracuje',
    nobody: 'Nepriradené',
    nextStep: 'Ďalší krok',
    contactedAt: 'Napísali sme',
    updatedBy: (who, when) => `Zmenil(a) ${who} · ${when}`,
    mine: 'Moje',
    everyone: 'Všetci',
    unassigned: 'Bez zodpovedného',
    person: 'Osoba',
    suggested: 'navrhnuté automaticky',
    direction: 'Čo sa stalo',
  },
  work: {
    title: 'Práca s kontaktom',
    signInToEdit: 'Prihláste sa, aby ste mohli označovať typ, stav, rýchle značky a viesť denník komunikácie.',
    noAccess: 'Váš účet nemá rolu tímu. Obráťte sa na vlastníka.',
    save: 'Uložiť',
    saving: 'Ukladá sa…',
    saved: 'Uložené',
    prepare: 'Pripraviť správu',
    log: 'Denník komunikácie',
    logEmpty: 'Zatiaľ žiadne záznamy komunikácie.',
    addEntry: 'Pridať záznam do denníka',
    summary: 'Text alebo stručný obsah',
    summaryHint: 'Vložte odoslanú správu alebo prijatú odpoveď. Vidí iba tím.',
    add: 'Pridať',
    adding: 'Pridáva sa…',
    noSend: 'Portál nič neodosiela: text skopírujete a odošlete sami.',
    takeWork: 'Beriem do práce',
    takeOver: 'Prevziať do práce',
    youWork: 'Na tomto zázname pracujete vy',
    workingWith: (who) => `Pracuje: ${who}`,
    relationTicksHint: 'Zaškrtnite typ — záznam sa hneď presunie do príslušnej záložky v sekcii „Práca s kontaktmi“.',
    movedToTab: (tab) => `V záložke „${tab}“`,
    openTab: 'Otvoriť záložku →',
    stageLabel: 'Fáza práce (kliknutím zmeníte)',
    quickMarksLabel: 'Rýchle značky',
    statusHistoryTitle: 'História zmien stavu a zodpovedných',
    statusHistoryEmpty: 'Zatiaľ neboli zaznamenané žiadne zmeny stavu.',
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
    markDraft: 'Uložiť koncept a označiť „Prezrel(a)“',
    close: 'Zavrieť',
    rules: 'Pred odoslaním: skontrolujte pravidlá skupiny, píšte iba na pracovné kontakty organizácií, jedna správa a najviac jedna pripomienka (UWG / DSGVO).',
  },
  pipeline: {
    title: 'Práca s kontaktmi',
    meta: 'Záznamy podľa typu vzťahu, zoskupené podľa fáz. Farba: červená — začal pracovať, oranžová — prezrel, žltá — napísal správu, modrá — odpovedal, zelená — pracujeme spolu, sivá — odmietnuté.',
    empty: 'Prázdne',
    signIn: 'Sekcia je dostupná iba tímu po prihlásení.',
    open: 'Otvoriť',
    showNew: (count) => `Zobrazovať „Nové“ (${count})`,
  },
  stats: {
    title: 'Štatistika tímu',
    meta: 'Koľko záznamov si vzal každý člen tímu podľa fáz, odoslané správy, odpovede a prehľad komunikácie podľa záznamov.',
    kpiInWork: 'Vzaté do práce',
    kpiLetters: 'Napísaných správ',
    kpiReplies: 'Prijatých odpovedí',
    kpiWorking: 'Pracujeme spolu',
    teamTableTitle: 'Prehľad podľa člena tímu',
    member: 'Člen tímu',
    taken: 'Vzaté',
    lettersOut: 'Odoslané správy',
    repliesIn: 'Odpovede',
    notesCount: 'Poznámky',
    unassignedRow: 'Bez zodpovedného',
    totalRow: 'Spolu',
    marksCol: 'Značky',
    perRecordTitle: 'História podľa záznamov: kto komu čo písal',
    perRecordMeta: 'Úplná história správ a odpovedí pre každý kontakt alebo skupinu.',
    searchPlaceholder: 'Hľadať podľa názvu záznamu, autora alebo textu',
    allDirections: 'Všetky smery',
    allChannels: 'Všetky kanály',
    channelLabel: 'Kanál',
    who: 'Kto',
    toWhom: 'Komu (záznam)',
    what: 'Čo bolo napísané / odpoveď',
    when: 'Kedy',
    emptyInteractions: 'Pre tieto filtre zatiaľ nie sú žiadne záznamy komunikácie.',
    refresh: 'Obnoviť',
    groupByRecord: 'Zoskupiť podľa záznamov',
  },
  activity: {
    title: 'Kto komu písal',
    meta: 'Posledné kroky tímu: prevzatie do práce, zmeny stavu, rýchle značky, správy a odpovede.',
    empty: 'Zatiaľ žiadne kroky.',
    refresh: 'Obnoviť',
    event: (e, o, n) => {
      if (e === 'created') return `vzal(a) do práce (${n ?? ''})`
      if (e === 'status') return `stav: ${o ?? '—'} → ${n ?? '—'}`
      if (e === 'relation_type') return `typ: ${o ?? '—'} → ${n ?? '—'}`
      if (e === 'assigned_to') return `zodpovedný: ${o ?? '—'} → ${n ?? '—'}`
      if (e === 'marks') return `značky: ${o ?? '—'} → ${n ?? '—'}`
      if (e === 'next_step') return `ďalší krok: ${n ?? '—'}`
      if (e === 'interaction_out') return `napísal(a) (${o ?? ''}): ${n ?? ''}`
      if (e === 'interaction_in') return `dostal(a) odpoveď (${o ?? ''}): ${n ?? ''}`
      if (e === 'interaction_note') return `poznámka: ${n ?? ''}`
      return e
    },
  },
  help: {
    title: 'Vysvetlivky',
    meta: 'Čo znamenajú typy, stavy, rýchle značky, kanály a krajina v katalógu.',
    relations: 'Typy vzťahu (záložky v práci s kontaktmi)',
    statuses: 'Stavy práce a farby',
    marks: 'Rýchle značky',
    channels: 'Kanály',
    geo: 'Krajina / dosah',
    privacy: 'Čo vidia návštevníci bez prihlásenia',
    privacyBody: 'Bez prihlásenia je viditeľný katalóg a typ vzťahu. Stavy, rýchle značky, zodpovedných, štatistiky, denník komunikácie, poznámky a osobné kontakty vidí iba tím po prihlásení. Bez prihlásenia nie je možné nič meniť.',
    strategy: 'Celá stratégia komunikácie so šablónami je v dokumente „DATABASE — Стратегія звʼязку“ na Google Drive.',
  },
  account: {
    title: 'Môj profil a heslo',
    meta: 'Nastavte si meno v tíme a heslo na prihlasovanie bez e-mailu (e-maily majú limit niekoľko za hodinu).',
    profileSection: 'Meno v tíme',
    displayName: 'Zobrazované meno',
    displayNamePlaceholder: 'Napr. Samuel alebo Max',
    displayNameHint: 'Toto meno vidia všetci členovia tímu na odznakoch „Pracuje: …“ a v štatistikách.',
    displayNameSave: 'Uložiť meno',
    displayNameSaved: 'Meno aktualizované. Tím ho teraz vidí na všetkých kartách.',
    passwordSection: 'Heslo na prihlásenie',
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
