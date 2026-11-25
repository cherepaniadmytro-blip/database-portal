import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { PageHeader } from '../components/PageHeader.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { useCatalog } from '../context/CatalogData.tsx'
import {
  buildCatalogModel,
  displayEntity,
  displayLabel,
  NON_COMMUNITY_LABEL,
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
  const step = useCatalogStep()
  const model = useMemo(() => buildCatalogModel(catalog.rows, catalog.facets), [catalog.rows, catalog.facets])

  if (catalog.loading && catalog.rows.length === 0) {
    return (
      <>
        <PageHeader title="Каталог" meta="Завантаження публічних записів…" />
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
        <PageHeader title="Каталог" meta="Публічні записи зараз недоступні." />
        <div className="notice notice-error" role="alert">
          <span>{catalog.error}</span>
          <button type="button" className="btn btn-ghost" onClick={catalog.reload}>
            Повторити
          </button>
        </div>
      </>
    )
  }

  const total = model.groups.reduce((sum, card) => sum + card.count, 0) + (model.aside?.count ?? 0)
  const fallback = catalog.source === 'records' ? ' Запасне джерело — таблиця records.' : ''

  return (
    <div data-catalog-step={step.kind}>
      {catalog.error ? (
        <div className="notice notice-error" role="alert">
          <span>{catalog.error}</span>
          <button type="button" className="btn btn-ghost" onClick={catalog.reload}>
            Повторити
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
  return (
    <>
      <PageHeader
        title="Каталог"
        meta={`Крок 1 з 4. ${formatNumber(total)} ${recordsLabel(total)} без входу. Оберіть мовну або національну групу.${fallback}`}
      />
      <CardGrid cards={cards} hrefFor={(key) => buildCatalogHash({ kind: 'platforms', group: key })} empty="У каталозі ще немає груп." />
      {aside ? (
        <section className="catalog-aside" aria-label={NON_COMMUNITY_LABEL}>
          <p className="lede">Записи без мовної спільноти. Це не окрема група.</p>
          <div className="catalog-grid">
            <a className="catalog-card" href={buildCatalogHash({ kind: 'platforms', group: aside.key })}>
              <h2>{aside.label}</h2>
              <p className="catalog-card-count">
                <strong>{formatNumber(aside.count)}</strong>
                {recordsLabel(aside.count)}
              </p>
            </a>
          </div>
        </section>
      ) : null}
    </>
  )
}

function PlatformsStep({ group, cards }: { group: string; cards: CatalogCard[] }) {
  const total = cards.reduce((sum, card) => sum + card.count, 0)
  return (
    <>
      <Crumbs
        items={[
          { label: 'Каталог', href: buildCatalogHash({ kind: 'groups' }) },
          { label: displayLabel(group), current: true },
        ]}
      />
      <PageHeader
        title={displayLabel(group)}
        meta={`Крок 2 з 4. ${formatNumber(total)} ${recordsLabel(total)}. Оберіть платформу або тип.`}
        actions={<a className="btn btn-ghost" href={buildCatalogHash({ kind: 'groups' })}>Назад</a>}
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
        empty="У цій групі немає записів."
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
  const filtered = sortCatalog(filterCatalog(scoped, filters))
  const cities = distinctText(scoped, 'place')
  const countries = distinctText(scoped, 'country')
  const statuses = distinctStatuses(scoped)
  const categories = distinctCategories(scoped)
  const parent = buildCatalogHash({ kind: 'platforms', group })
  const active = Boolean(filters.q || filters.city || filters.country || filters.status || filters.category)

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
          { label: 'Каталог', href: buildCatalogHash({ kind: 'groups' }) },
          { label: displayLabel(group), href: parent },
          { label: displayLabel(platform), current: true },
        ]}
      />
      <PageHeader
        title={displayLabel(platform)}
        meta={`Крок 3 з 4 · ${displayLabel(group)}. ${formatNumber(filtered.length)} з ${formatNumber(scoped.length)}. Сортування за рейтингом; без оцінки — за пріоритетом.`}
        actions={<a className="btn btn-ghost" href={parent}>Назад</a>}
      />
      <form className="filters" role="search" onSubmit={(event) => event.preventDefault()}>
        <label className="field field-grow">
          <span>Пошук</span>
          <input
            type="search"
            value={filters.q}
            placeholder="Назва, місто, опис"
            onChange={(event) => setFilter({ q: event.target.value })}
          />
        </label>
        <label className="field">
          <span>Місто</span>
          <select value={filters.city} onChange={(event) => setFilter({ city: event.target.value })}>
            <option value="">Усі</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Країна</span>
          <select value={filters.country} onChange={(event) => setFilter({ country: event.target.value })}>
            <option value="">Усі</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Статус</span>
          <select value={filters.status} onChange={(event) => setFilter({ status: event.target.value })}>
            <option value="">Усі</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Категорія</span>
          <select value={filters.category} onChange={(event) => setFilter({ category: event.target.value })}>
            <option value="">Усі</option>
            {categories.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        {active ? (
          <button type="button" className="btn btn-ghost filter-reset" onClick={() => setFilter({ q: '', city: '', country: '', status: '', category: '' })}>
            Скинути
          </button>
        ) : null}
      </form>
      {filtered.length === 0 ? (
        <p className="empty">Немає записів за цими умовами.</p>
      ) : (
        <div className="catalog-table">
          <div className="catalog-head" aria-hidden="true">
            <span>#</span>
            <span>Назва</span>
            <span>Місто</span>
            <span>Аудиторія</span>
            <span>Рейтинг</span>
            <span>Статус</span>
          </div>
          <ol className="catalog-list">
            {filtered.map((row, index) => (
              <li key={row.id}>
                <a
                  className="catalog-row"
                  href={buildCatalogHash({ kind: 'detail', group, platform, id: row.id, filters })}
                >
                  <span className="catalog-rank">{index + 1}</span>
                  <span className="catalog-name">{row.name}</span>
                  <span className="catalog-city">{row.place || '—'}</span>
                  <span className="catalog-aud">
                    <span className="cell-label">Аудиторія</span>
                    {formatAudience(row.audienceSize)}
                  </span>
                  <span className="catalog-rate">
                    <span className="cell-label">Рейтинг</span>
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
  if (!row) {
    return (
      <>
        <Crumbs
          items={[
            { label: 'Каталог', href: buildCatalogHash({ kind: 'groups' }) },
            { label: displayLabel(group), href: buildCatalogHash({ kind: 'platforms', group }) },
            { label: displayLabel(platform), href: listHref },
            { label: 'Запис', current: true },
          ]}
        />
        <PageHeader title="Запис не знайдено" meta={id} actions={<a className="btn btn-ghost" href={listHref}>Назад</a>} />
        <p className="empty">Цього запису немає у публічному каталозі.</p>
      </>
    )
  }

  const links = [
    { label: 'Вебсайт', href: safeUrl(row.website) },
    { label: 'Джерело', href: safeUrl(row.sourceUrl) },
    { label: 'Деталі', href: safeUrl(row.detailsLink) },
  ].filter((item) => item.href)

  return (
    <>
      <Crumbs
        items={[
          { label: 'Каталог', href: buildCatalogHash({ kind: 'groups' }) },
          { label: displayLabel(row.languageGroup), href: buildCatalogHash({ kind: 'platforms', group: row.languageGroup }) },
          {
            label: displayLabel(row.platform),
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
            Крок 4 з 4 · {row.categoryLabel || row.category || 'Без розділу'} · <span className="mono">{row.id}</span>
          </>
        }
        actions={<a className="btn btn-ghost" href={listHref}>Назад</a>}
      />
      <div className="detail">
        <section className="panel">
          {row.description ? <p className="lead">{row.description}</p> : null}
          <dl className="facts">
            <Fact label="Розділ" value={row.categoryLabel || row.category} />
            <Fact label="Підкатегорія" value={row.subcategory} />
            <Fact label="Організація" value={row.organization} />
            <Fact label="Країна" value={row.country} />
            <Fact label="Місто" value={row.city} />
            <Fact label="Регіон" value={row.cityRegion} />
            <Fact label="Аудиторія" value={formatAudience(row.audienceSize)} keep />
            <Fact label="Звідки аудиторія" value={row.audienceSource} />
            <Fact label="Мовна група" value={row.languageGroupLabel || displayLabel(row.languageGroup)} />
            <Fact label="Національність" value={row.nationality} />
            <Fact label="Мова / спільнота" value={row.languageCommunity} />
            <Fact label="Платформа" value={displayLabel(row.platform)} />
            <Fact label="Тип" value={displayEntity(row.entityType)} />
            <Fact label="Статус" value={row.status ? <StatusBadge status={row.status} /> : null} />
            <Fact label="Пріоритет" value={row.priority} />
            <Fact label="Рейтинг" value={formatMaybeNumber(row.ratingScore)} keep />
            <Fact label="Надійність" value={row.reliability == null ? null : formatMaybeNumber(row.reliability)} />
            <Fact label="Потенціал" value={row.potential == null ? null : formatMaybeNumber(row.potential)} />
            <Fact label="Тип партнера" value={row.partnerType} />
            <Fact label="Джерело" value={row.source} />
            <Fact label="Дата публікації" value={row.publishedDate ? formatDay(row.publishedDate) : null} />
          </dl>
        </section>
        <aside className="rail">
          <section className="panel">
            <h2>Посилання</h2>
            {links.length === 0 ? (
              <p className="empty">Немає публічних посилань.</p>
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
            <h2>Дати</h2>
            <dl className="rail-facts">
              <div>
                <dt>Додано</dt>
                <dd>{formatDay(row.dateAdded)}</dd>
              </div>
              <div>
                <dt>Оновлено</dt>
                <dd>{formatDay(row.lastUpdated)}</dd>
              </div>
              <div>
                <dt>Перевірено</dt>
                <dd>{formatDay(row.lastChecked)}</dd>
              </div>
              <div>
                <dt>Синхронізовано</dt>
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
  if (cards.length === 0) return <p className="empty">{empty}</p>
  return (
    <div className="catalog-grid">
      {cards.map((card) => (
        <a key={card.key} className="catalog-card" href={hrefFor(card.key)}>
          <h2>{card.label}</h2>
          <p className="catalog-card-count">
            <strong>{formatNumber(card.count)}</strong>
            {recordsLabel(card.count)}
          </p>
        </a>
      ))}
    </div>
  )
}

function Crumbs({ items }: { items: Array<{ label: string; href?: string; current?: boolean }> }) {
  return (
    <nav className="crumbs" aria-label="Кроки каталогу">
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
