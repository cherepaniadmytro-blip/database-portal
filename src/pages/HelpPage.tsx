import { PageHeader } from '../components/PageHeader.tsx'
import { OutreachBadge, RelationBadge } from '../components/CrmBadges.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { channelLabel, crmMessages, geoLabel } from '../i18n/crm.ts'
import { CHANNELS, GEO_SCOPES, RELATIONS, STATUSES } from '../lib/crm.ts'

const CHANNEL_HELP: Record<string, { uk: string; sk: string }> = {
  email: { uk: 'Лише робочі адреси організацій (info@, kontakt@). Один персональний лист.', sk: 'Iba pracovné adresy organizácií (info@, kontakt@). Jedna osobná správa.' },
  telegram: { uk: 'Контакт з опису каналу («з питань реклами»). Коротко, з посиланням.', sk: 'Kontakt z popisu kanála („reklama“). Stručne, s odkazom.' },
  facebook: { uk: 'Адміністратору групи в Messenger; спершу правила групи.', sk: 'Správcovi skupiny cez Messenger; najprv pravidlá skupiny.' },
  phone: { uk: 'Лише організаціям у робочий час; без холодних дзвінків приватним особам.', sk: 'Iba organizáciám v pracovnom čase; žiadne studené hovory súkromným osobám.' },
  form: { uk: 'Контактна форма або Impressum на сайті — той самий текст, що й для email.', sk: 'Kontaktný formulár alebo Impressum — rovnaký text ako e-mail.' },
  instagram: { uk: 'Коротке повідомлення в Direct; без масових DM.', sk: 'Krátka správa cez Direct; žiadne hromadné DM.' },
}

export function HelpPage() {
  const { locale } = useLocale()
  const m = crmMessages(locale)
  const lang = locale === 'sk' ? 'sk' : 'uk'
  return (
    <>
      <PageHeader title={m.help.title} meta={m.help.meta} />
      <section className="panel">
        <h2>{m.help.relations}</h2>
        <dl className="legend">
          {RELATIONS.map((value) => (
            <div key={value}>
              <dt>
                <RelationBadge relation={value} />
              </dt>
              <dd>{m.relationHelp[value]}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="panel">
        <h2>{m.help.statuses}</h2>
        <dl className="legend">
          {STATUSES.map((value) => (
            <div key={value}>
              <dt>
                <OutreachBadge status={value} />
              </dt>
              <dd>{m.statusHelp[value]}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="panel">
        <h2>{m.help.channels}</h2>
        <dl className="legend">
          {CHANNELS.map((value) => (
            <div key={value}>
              <dt>{channelLabel(locale, value)}</dt>
              <dd>{CHANNEL_HELP[value]?.[lang]}</dd>
            </div>
          ))}
        </dl>
      </section>
      <section className="panel">
        <h2>{m.help.geo}</h2>
        <p className="desc">
          {lang === 'sk'
            ? 'Väčšina záznamov sa týka ľudí žijúcich v Nemecku. „Krajina / dosah“ ukazuje, kde organizácia sídli alebo pôsobí (napr. agentúra zo Slovenska, ktorá umiestňuje ľudí v Nemecku).'
            : 'Більшість записів стосується людей, які живуть у Німеччині. «Країна / охоплення» показує, де організація розташована або діє (наприклад, агенція зі Словаччини, що працевлаштовує в Німеччині).'}
        </p>
        <ul className="link-list">
          {GEO_SCOPES.map((value) => (
            <li key={value}>{geoLabel(locale, value)}</li>
          ))}
        </ul>
      </section>
      <section className="panel">
        <h2>{m.help.privacy}</h2>
        <p>{m.help.privacyBody}</p>
        <p className="desc">{m.help.strategy}</p>
      </section>
    </>
  )
}
