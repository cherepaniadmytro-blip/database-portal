import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { PageHeader } from '../components/PageHeader.tsx'
import { useLocale } from '../context/LocaleContext.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { useCatalog } from '../context/CatalogData.tsx'
import {
  buildCatalogModel,
  displayEntity,
  displayLabel,
  distinctCategories,
  distinctStatuses,
  distinctText,
  filterCatalog,
  recordsLabel,
  sortCatalog,
  type CatalogCard,
  type PublicRecord,
} from '../lib/catalog.ts'
import {
  buildCatalogHash,
  parseCatalogHash,
  replaceCatalogHash,
  type CatalogFilters,
  type CatalogStep,
} from '../lib/catalogRoute.ts'
import { formatDateTime, formatDay, formatMaybeNumber, formatNumber, safeUrl } from '../lib/records.ts'
import { OwnerNotes } from '../components/OwnerNotes.tsx'
import { OutreachBadge, RelationBadge } from '../components/CrmBadges.tsx'
import { WorkflowPanel } from '../components/WorkflowPanel.tsx'
import { useCrm } from '../context/CrmData.tsx'
import { crmMessages, geoLabel } from '../i18n/crm.ts'
import { PIPELINE_RELATIONS, RELATIONS } from '../lib/crm.ts'

function useCatalogStep(): CatalogStep {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const sync = () => setHash(window.location.hash)
    window.addEventListener('hashchange', sync)
    return () => window.removeEventListener('hashchange', sync)
  }, [])
  return useMemo(() => parseCatalogHash(hash), [hash])
}

export function CatalogPage() {
  const catalog = useCatalog()
  const { t } = useLocale()
  const step = useCatalogStep()
  const model = useMemo(() => buildCatalogModel(catalog.rows, catalog.facets), [catalog.rows, catalog.facets])

  if (catalog.loading && catalog.rows.length === 0) {
    return (
      <>
        <PageHeader title={t.catalog.title} meta={t.catalog.loading} />
        <div className="catalog-grid" aria-hidden="true">
          {Array.from({ length: 8 }, (_, index) => (
            <div key={index} className="catalog-card skeleton-block" />
          ))}
        </div>
      </>
    )
  }

  if (catalog.error && catalog.rows.length === 0) {
    return (
      <>
        <PageHeader title={t.catalog.title} meta={t.catalog.unavailable} />
        <div className="notice notice-error" role="alert">
          <span>{catalog.error}</span>
          <button type="button" className="btn btn-ghost" onClick={catalog.reload}>
            {t.retry}
          </button>
        </div>
      </>
    )
  }

  const total = model.groups.reduce((sum, card) => sum + card.count, 0) + (model.aside?.count ?? 0)
  const fallback = catalog.source === 'records' ? t.catalog.fallbackSource : ''

  return (
    <div data-catalog-step={step.kind}>
      {catalog.error ? (
        <div className="notice notice-error" role="alert">
          <span>{catalog.error}</span>
          <button type="button" className="btn btn-ghost" onClick={catalog.reload}>
            {t.retry}
          </button>
        </div>
      ) : null}
      {step.kind === 'groups' ? (
        <GroupsStep total={total} cards={model.groups} aside={model.aside} fallback={fallback} />
      ) : null}
      {step.kind === 'platforms' ? (
        <PlatformsStep group={step.group} cards={model.platformsFor(step.group)} />
      ) : null}
      {step.kind === 'list' ? (
        <ListStep
          group={step.group}
          platform={step.platform}
          filters={step.filters}
          rows={catalog.rows}
        />
      ) : null}
      {step.kind === 'detail' ? (
        <DetailStep
          group={step.group}
          platform={step.platform}
          id={step.id}
          filters={step.filters}
          rows={catalog.rows}
        />
      ) : null}
    </div>
  )
}

function GroupsStep({
  total,
  cards,
  aside,
  fallback,
}: {
  total: number
  cards: CatalogCard[]
  aside: CatalogCard | null
  fallback: string
}) {
  const { locale, t } = useLocale()
  return (
    <>
      <PageHeader
        title={t.catalog.title}
        meta={t.catalog.step1(formatNumber(total), recordsLabel(total, locale), fallback)}
      />
      <CardGrid cards={cards} hrefFor={(key) => buildCatalogHash({ kind: 'platforms', group: key })} empty={t.catalog.emptyGroups} />
      {aside ? (
        <section className="catalog-aside" aria-label={displayLabel(aside.key, locale)}>
          <p className="lede">{t.catalog.asideLede}</p>
          <div className="catalog-grid">
            <a className="catalog-card" href={buildCatalogHash({ kind: 'platforms', group: aside.key })}>
              <h2>{displayLabel(aside.key, locale)}</h2>
              <p className="catalog-card-count">
                <strong>{formatNumber(aside.count)}</strong>
                {recordsLabel(aside.count, locale)}
              </p>
            </a>
          </div>
        </section>
      ) : null}
    </>
  )
}

function PlatformsStep({ group, cards }: { group: string; cards: CatalogCard[] }) {
  const { locale, t } = useLocale()
  const total = cards.reduce((sum, card) => sum + card.count, 0)
  return (
    <>
      <Crumbs
        items={[
          { label: t.catalog.title, href: buildCatalogHash({ kind: 'groups' }) },
          { label: displayLabel(group, locale), current: true },
        ]}
      />
      <PageHeader
        title={displayLabel(group, locale)}
        meta={t.catalog.step2(formatNumber(total), recordsLabel(total, locale))}
        actions={<a className="btn btn-ghost" href={buildCatalogHash({ kind: 'groups' })}>{t.back}</a>}
      />
      <CardGrid
        cards={cards}
        hrefFor={(key) =>
          buildCatalogHash({
            kind: 'list',
            group,
            platform: key,
            filters: { q: '', city: '', country: '', status: '', category: '' },
          })
        }
        empty={t.catalog.emptyPlatforms}
      />
    </>
  )
}

function ListStep({
  group,
  platform,
  filters,
  rows,
}: {
  group: string
  platform: string
  filters: CatalogFilters
  rows: PublicRecord[]
}) {
  const scoped = rows.filter((row) => row.languageGroup === group && row.platform === platform)
  const cities = distinctText(scoped, 'place')
  const crm = useCrm()
  const withRelation = scoped.map((row) => {
    const relation = crm.workflows.get(row.id)?.relationType
    return relation && relation !== row.relationType ? { ...row, relationType: relation } : row
  })
  const countries = distinctText(scoped, 'geoScope')
  const statuses = distinctStatuses(scoped)
  const categories = distinctCategories(scoped)
  const filtered = sortCatalog(filterCatalog(withRelation, filters))
  const parent = buildCatalogHash({ kind: 'platforms', group })
  const active = Boolean(filters.q || filters.city || filters.country || filters.status || filters.category || filters.relation)
  const { locale, t } = useLocale()
  const cm = crmMessages(locale)
  const relations = RELATIONS.filter((value) => withRelation.some((row) => row.relationType === value))

  function setFilter(patch: Partial<CatalogFilters>) {
    replaceCatalogHash(
      buildCatalogHash({
        kind: 'list',
        group,
        platform,
        filters: { ...filters, ...patch },
      }),
    )
  }

  return (
    <>
      <Crumbs
        items={[
          { label: t.catalog.title, href: buildCatalogHash({ kind: 'groups' }) },
          { label: displayLabel(group, locale), href: parent },
          { label: displayLabel(platform, locale), current: true },
        ]}
      />
      <PageHeader
        title={displayLabel(platform, locale)}
        meta={t.catalog.step3(displayLabel(group, locale), formatNumber(filtered.length), formatNumber(scoped.length))}
        actions={<a className="btn btn-ghost" href={parent}>{t.back}</a>}
      />
      <form className="filters" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="field field-grow">
          <span>{t.catalog.search}</span>
          <input
            type="search"
            value={filters.q}
            placeholder={t.catalog.searchPlaceholder}
            onChange={(event) => setFilter({ q: event.target.value })}
          />
        </label>
        <label className="field">
          <span>{t.catalog.city}</span>
          <select value={filters.city} onChange={(event) => setFilter({ city: event.target.value })}>
            <option value="">{t.all}</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.catalog.country}</span>
          <select value={filters.country} onChange={(event) => setFilter({ country: event.target.value })}>
            <option value="">{t.all}</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {geoLabel(locale, country)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.catalog.status}</span>
          <select value={filters.status} onChange={(event) => setFilter({ status: event.target.value })}>
            <option value="">{t.all}</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.catalog.category}</span>
          <select value={filters.category} onChange={(event) => setFilter({ category: event.target.value })}>
            <option value="">{t.all}</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{cm.f.relation}</span>
          <select value={filters.relation ?? ''} onChange={(event) => setFilter({ relation: event.target.value })}>
            <option value="">{t.all}</option>
            {relations.map((value) => (
              <option key={value} value={value}>
                {cm.relation[value]}
              </option>
            ))}
          </select>
        </label>
        {active ? (
          <button type="button" className="btn btn-ghost filter-reset" onClick={() => setFilter({ q: '', city: '', country: '', status: '', category: '', relation: '' })}>
            {t.reset}
          </button>
        ) : null}
      </form>
      {filtered.length === 0 ? (
        <p className="empty">{t.catalog.emptyFiltered}</p>
      ) : (
        <div className="catalog-table">
          <div className="catalog-head" aria-hidden="true">
            <span>#</span>
            <span>{t.catalog.name}</span>
            <span>{t.catalog.city}</span>
            <span>{t.catalog.audience}</span>
            <span>{t.catalog.rating}</span>
            <span>{t.catalog.status}</span>
          </div>
          <ol className="catalog-list">
            {filtered.map((row, index) => (
              <li key={row.id}>
                <a
                  className="catalog-row"
                  href={buildCatalogHash({ kind: 'detail', group, platform, id: row.id, filters })}
                >
                  <span className="catalog-rank">{index + 1}</span>
                  <span className="catalog-name">
                    {row.name}
                    <span className="catalog-badges">
                      <RelationBadge relation={row.relationType} />
                      {crm.canEdit && crm.workflows.get(row.id) && row.relationType && PIPELINE_RELATIONS.includes(row.relationType) ? (
                        <OutreachBadge status={crm.workflows.get(row.id)?.status} />
                      ) : null}
                    </span>
                  </span>
                  <span className="catalog-city">
                    {row.place || '—'}
                    {row.geoScope && row.geoScope !== 'Germany' && row.geoScope !== 'Not applicable' ? (
                      <span className="catalog-geo"> · {geoLabel(locale, row.geoScope)}</span>
                    ) : null}
                  </span>
                  <span className="catalog-aud">
                    <span className="cell-label">{t.catalog.audience}</span>
                    {formatAudience(row.audienceSize)}
                  </span>
                  <span className="catalog-rate">
                    <span className="cell-label">{t.catalog.rating}</span>
                    {formatMaybeNumber(row.ratingScore)}
                  </span>
                  <span className="catalog-status">
                    <StatusBadge status={row.status} />
                  </span>
                </a>
              </li>
            ))}
          </ol>
        </div>
      )}
    </>
  )
}

function DetailStep({
  group,
  platform,
  id,
  filters,
  rows,
}: {
  group: string
  platform: string
  id: string
  filters: CatalogFilters
  rows: PublicRecord[]
}) {
  const row = rows.find((item) => item.id === id)
  const listHref = buildCatalogHash({ kind: 'list', group, platform, filters })
  const { locale, t } = useLocale()
  if (!row) {
    return (
      <>
        <Crumbs
          items={[
            { label: t.catalog.title, href: buildCatalogHash({ kind: 'groups' }) },
            { label: displayLabel(group, locale), href: buildCatalogHash({ kind: 'platforms', group }) },
            { label: displayLabel(platform, locale), href: listHref },
            { label: t.catalog.record, current: true },
          ]}
        />
        <PageHeader title={t.catalog.notFound} meta={id} actions={<a className="btn btn-ghost" href={listHref}>{t.back}</a>} />
        <p className="empty">{t.catalog.notInCatalog}</p>
      </>
    )
  }

  const links = [
    { label: t.catalog.website, href: safeUrl(row.website) },
    { label: t.catalog.source, href: safeUrl(row.sourceUrl) },
    { label: t.catalog.details, href: safeUrl(row.detailsLink) },
  ].filter((item) => item.href)

  return (
    <>
      <Crumbs
        items={[
          { label: t.catalog.title, href: buildCatalogHash({ kind: 'groups' }) },
          { label: displayLabel(row.languageGroup, locale), href: buildCatalogHash({ kind: 'platforms', group: row.languageGroup }) },
          {
            label: displayLabel(row.platform, locale),
            href: buildCatalogHash({
              kind: 'list',
              group: row.languageGroup,
              platform: row.platform,
              filters: row.languageGroup === group && row.platform === platform ? filters : { q: '', city: '', country: '', status: '', category: '' },
            }),
          },
          { label: row.name, current: true },
        ]}
      />
      <PageHeader
        title={row.name}
        meta={
          <>
            {t.catalog.step4(row.categoryLabel || row.category || t.catalog.noSection)} · <span className="mono">{row.id}</span>
          </>
        }
        actions={<a className="btn btn-ghost" href={listHref}>{t.back}</a>}
      />
      <div className="detail">
        <section className="panel">
          {row.description ? <p className="lead">{row.description}</p> : null}
          <dl className="facts">
            <Fact label={t.catalog.section} value={row.categoryLabel || row.category} />
            <Fact label={t.catalog.subcategory} value={row.subcategory} />
            <Fact label={t.catalog.organization} value={row.organization} />
            <Fact label={crmMessages(locale).f.geo} value={geoLabel(locale, row.geoScope)} />
            <Fact label={t.catalog.city} value={row.city} />
            <Fact label={t.catalog.region} value={row.cityRegion} />
            <Fact label={t.catalog.audience} value={formatAudience(row.audienceSize)} keep />
            <Fact label={t.catalog.audienceSource} value={row.audienceSource} />
            <Fact label={t.catalog.languageGroup} value={displayLabel(row.languageGroup, locale)} />
            <Fact label={t.catalog.nationality} value={row.nationality} />
            <Fact label={t.catalog.languageCommunity} value={row.languageCommunity} />
            <Fact label={t.catalog.platform} value={displayLabel(row.platform, locale)} />
            <Fact label={t.catalog.type} value={displayEntity(row.entityType, locale)} />
            <Fact label={t.catalog.status} value={row.status ? <StatusBadge status={row.status} /> : null} />
            <Fact label={t.catalog.priority} value={row.priority} />
            <Fact label={t.catalog.rating} value={formatMaybeNumber(row.ratingScore)} keep />
            <Fact label={t.catalog.reliability} value={row.reliability == null ? null : formatMaybeNumber(row.reliability)} />
            <Fact label={t.catalog.potential} value={row.potential == null ? null : formatMaybeNumber(row.potential)} />
            <Fact label={t.catalog.partnerType} value={row.partnerType} />
            <Fact label={t.catalog.source} value={row.source} />
            <Fact label={t.catalog.published} value={row.publishedDate ? formatDay(row.publishedDate) : null} />
          </dl>
        </section>
        <WorkflowPanel row={row} />
        <aside className="rail">
          <section className="panel">
            <h2>{t.catalog.links}</h2>
            {links.length === 0 ? (
              <p className="empty">{t.catalog.noPublicLinks}</p>
            ) : (
              <ul className="link-list">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href ?? undefined} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <OwnerNotes id={row.id} />
          <section className="panel">
            <h2>{t.catalog.dates}</h2>
            <dl className="rail-facts">
              <div>
                <dt>{t.catalog.added}</dt>
                <dd>{formatDay(row.dateAdded)}</dd>
              </div>
              <div>
                <dt>{t.catalog.updated}</dt>
                <dd>{formatDay(row.lastUpdated)}</dd>
              </div>
              <div>
                <dt>{t.catalog.checked}</dt>
                <dd>{formatDay(row.lastChecked)}</dd>
              </div>
              <div>
                <dt>{t.catalog.synced}</dt>
                <dd>{formatDateTime(row.syncedAt)}</dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </>
  )
}

function Fact({ label, value, keep = false }: { label: string; value: ReactNode; keep?: boolean }) {
  if (!keep && (value == null || value === '' || value === '—')) return null
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  )
}

function CardGrid({
  cards,
  hrefFor,
  empty,
}: {
  cards: CatalogCard[]
  hrefFor: (key: string) => string
  empty: string
}) {
  const { locale } = useLocale()
  if (cards.length === 0) return <p className="empty">{empty}</p>
  return (
    <div className="catalog-grid">
      {cards.map((card) => (
        <a key={card.key} className="catalog-card" href={hrefFor(card.key)}>
          <h2>{displayLabel(card.key, locale)}</h2>
          <p className="catalog-card-count">
            <strong>{formatNumber(card.count)}</strong>
            {recordsLabel(card.count, locale)}
          </p>
        </a>
      ))}
    </div>
  )
}

function Crumbs({ items }: { items: Array<{ label: string; href?: string; current?: boolean }> }) {
  const { t } = useLocale()
  return (
    <nav className="crumbs" aria-label={t.catalog.crumbs}>
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="crumb">
          {item.href && !item.current ? <a href={item.href}>{item.label}</a> : <span aria-current={item.current ? 'page' : undefined}>{item.label}</span>}
        </span>
      ))}
    </nav>
  )
}

function formatAudience(value: number | null): string {
  if (value == null) return '—'
  return formatNumber(value)
}
