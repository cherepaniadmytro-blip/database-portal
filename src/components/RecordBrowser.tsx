import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLocale } from '../context/LocaleContext.tsx'
import { downloadCsv, recordsToCsv } from '../lib/csv.ts'
import {
  EMPTY_FILTERS,
  applyFilters,
  csvFilename,
  isDateField,
  rowFreshness,
  scopeRecords,
  sortRecords,
  todayISO,
  uniqueValues,
} from '../lib/records.ts'
import type { FilterState, RecordRow, SortDir, SortKey } from '../lib/types.ts'
import { useCrm } from '../context/CrmData.tsx'
import { effectiveRelation, isRelation } from '../lib/crm.ts'
import { recordStatusLabel, sectionLabel } from '../lib/labels.ts'
import { AssigneeBadge, OutreachBadge, RelationBadge } from './CrmBadges.tsx'
import { StatusBadge } from './StatusBadge.tsx'

const PAGE_SIZE = 50

const DATE_FIELD_KEYS: FilterState['dateField'][] = ['date_added', 'last_updated', 'last_verified']

type Column = {
  key: SortKey
  label: string
  className?: string
  render: (row: RecordRow, today: string) => ReactNode
}

function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function RecordBrowser({
  rows,
  filename,
  lockCategory,
  archiveOnly = false,
  showCategory = false,
  query,
  onQueryChange,
}: {
  rows: RecordRow[]
  filename: string
  lockCategory?: string
  archiveOnly?: boolean
  showCategory?: boolean
  query?: string
  onQueryChange?: (query: string) => void
}) {
  const navigate = useNavigate()
  const { locale, t } = useLocale()
  const crm = useCrm()
  const [filters, setFilters] = useState<FilterState>({ ...EMPTY_FILTERS, q: query ?? '' })
  const [sortKey, setSortKey] = useState<SortKey>('potential')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)
  const today = useMemo(() => todayISO(), [])

  useEffect(() => {
    if (query === undefined) return
    setFilters((current) => (current.q === query ? current : { ...current, q: query }))
  }, [query])

  const scoped = useMemo(
    () => scopeRecords(rows, { category: lockCategory, archiveOnly }),
    [rows, lockCategory, archiveOnly],
  )
  const filtered = useMemo(() => applyFilters(scoped, filters), [scoped, filters])
  const sorted = useMemo(() => sortRecords(filtered, sortKey, sortDir), [filtered, sortKey, sortDir])
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const visible = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const statuses = useMemo(() => uniqueValues(scoped, 'status'), [scoped])
  const priorities = useMemo(() => uniqueValues(scoped, 'priority'), [scoped])
  const countries = useMemo(() => uniqueValues(scoped, 'country'), [scoped])
  const categories = useMemo(() => uniqueValues(scoped, 'category'), [scoped])

  function patch(partial: Partial<FilterState>) {
    if (partial.q !== undefined) onQueryChange?.(partial.q)
    setFilters((current) => ({ ...current, ...partial }))
    setPage(0)
  }

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(key)
      setSortDir(key === 'name' || key === 'country' || key === 'category' || key === 'subcategory' ? 'asc' : 'desc')
    }
    setPage(0)
  }

  function exportCsv() {
    downloadCsv(csvFilename(filename), recordsToCsv(sorted))
  }

  const columns: Column[] = [
    {
      key: 'name',
      label: t.browser.name,
      render: (row) => {
        const fresh = rowFreshness(row, today)
        return (
          <div className="name-cell">
            <span className="name-line">
              <span>{row.name}</span>
              {fresh === 'new' ? <span className="mark mark-new">{t.browser.markNew}</span> : null}
              {fresh === 'updated' ? <span className="mark mark-updated">{t.browser.markUpdated}</span> : null}
              {crm.canEdit ? (
                <span className="catalog-badges">
                  <RelationBadge relation={effectiveRelation(isRelation(row.relation_type) ? row.relation_type : null, crm.workflows.get(row.id))} />
                  {crm.workflows.get(row.id) ? (
                    <>
                      <OutreachBadge status={crm.workflows.get(row.id)?.status} />
                      <AssigneeBadge
                        assignedTo={crm.workflows.get(row.id)?.assignedTo}
                        team={crm.team}
                        currentUserId={crm.userId}
                      />
                    </>
                  ) : null}
                </span>
              ) : null}
            </span>
            {row.short_description ? <span className="desc">{row.short_description}</span> : null}
          </div>
        )
      },
    },
    ...(showCategory
      ? [
          {
            key: 'category' as const,
            label: t.browser.section,
            render: (row: RecordRow) => sectionLabel(row.category, row.category, locale),
          },
        ]
      : []),
    {
      key: 'subcategory',
      label: t.browser.subcategory,
      className: 'col-sub',
      render: (row) => <span className="clip-2">{row.subcategory || '—'}</span>,
    },
    {
      key: 'country',
      label: t.browser.country,
      className: 'col-tight',
      render: (row) => row.country || '—',
    },
    {
      key: 'status',
      label: t.browser.status,
      className: 'col-tight',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'priority',
      label: t.browser.priority,
      className: 'col-num',
      render: (row) => row.priority || '—',
    },
    {
      key: 'potential',
      label: t.browser.potential,
      className: 'col-num',
      render: (row) => (row.potential == null ? '—' : String(row.potential)),
    },
    {
      key: 'date_added',
      label: t.browser.added,
      className: 'col-date',
      render: (row) => formatCellDate(row.date_added),
    },
    {
      key: 'last_updated',
      label: t.browser.updated,
      className: 'col-date',
      render: (row) => formatCellDate(row.last_updated),
    },
  ]

  const from = sorted.length === 0 ? 0 : safePage * PAGE_SIZE + 1
  const to = Math.min(sorted.length, (safePage + 1) * PAGE_SIZE)

  return (
    <div className="browser">
      <div className="filters">
        <label className="field field-grow">
          <span>{t.browser.search}</span>
          <input
            value={filters.q}
            onChange={(event) => patch({ q: event.target.value })}
            placeholder={t.browser.searchPlaceholder}
            type="search"
          />
        </label>
        {showCategory && !lockCategory ? (
          <label className="field">
            <span>{t.browser.section}</span>
            <select value={filters.category} onChange={(event) => patch({ category: event.target.value })}>
              <option value="">{t.browser.all}</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {sectionLabel(value, value, locale)}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="field">
          <span>{t.browser.status}</span>
          <select value={filters.status} onChange={(event) => patch({ status: event.target.value })}>
            <option value="">{t.browser.all}</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {recordStatusLabel(value, locale)}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.browser.priority}</span>
          <select value={filters.priority} onChange={(event) => patch({ priority: event.target.value })}>
            <option value="">{t.browser.all}</option>
            {priorities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.browser.country}</span>
          <select value={filters.country} onChange={(event) => patch({ country: event.target.value })}>
            <option value="">{t.browser.all}</option>
            {countries.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.browser.dateField}</span>
          <select
            value={filters.dateField}
            onChange={(event) => {
              if (isDateField(event.target.value)) patch({ dateField: event.target.value })
            }}
          >
            {DATE_FIELD_KEYS.map((value) => (
              <option key={value} value={value}>
                {value === 'date_added' ? t.browser.dateAdded : value === 'last_updated' ? t.browser.lastUpdated : t.browser.lastVerified}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>{t.browser.from}</span>
          <input type="date" value={filters.dateFrom} onChange={(event) => patch({ dateFrom: event.target.value })} />
        </label>
        <label className="field">
          <span>{t.browser.to}</span>
          <input type="date" value={filters.dateTo} onChange={(event) => patch({ dateTo: event.target.value })} />
        </label>
        <button
          type="button"
          className="btn btn-ghost filter-reset"
          onClick={() => {
            onQueryChange?.('')
            setFilters({ ...EMPTY_FILTERS })
            setPage(0)
          }}
        >
          {t.browser.reset}
        </button>
      </div>

      <div className="toolbar">
        <p className="toolbar-count">
          {sorted.length === scoped.length
            ? t.browser.countAll(sorted.length)
            : t.browser.countFiltered(sorted.length, scoped.length)}
          {sorted.length > 0 ? ` · ${from}–${to}` : ''}
        </p>
        <p className="legend">
          <i className="swatch swatch-new" /> {t.browser.addedToday}
          <i className="swatch swatch-updated" /> {t.browser.updatedToday}
        </p>
        <button type="button" className="btn btn-primary" onClick={exportCsv} disabled={sorted.length === 0}>
          {t.browser.export(sorted.length)}
        </button>
      </div>

      <div className="table-wrap">
        <table className="data-table clickable">
          <thead>
            <tr>
              {columns.map((column) => {
                const active = sortKey === column.key
                return (
                  <th
                    key={column.key}
                    className={column.className}
                    aria-sort={active ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button type="button" className={cx('sort-btn', active && 'active')} onClick={() => toggleSort(column.key)}>
                      {column.label}
                      {active ? <span aria-hidden="true">{sortDir === 'asc' ? ' ↑' : ' ↓'}</span> : null}
                    </button>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td className="empty-cell" colSpan={columns.length}>
                  {t.browser.empty}
                </td>
              </tr>
            ) : (
              visible.map((row) => {
                const fresh = rowFreshness(row, today)
                return (
                  <tr
                    key={row.id}
                    className={cx(fresh === 'new' && 'row-new', fresh === 'updated' && 'row-updated')}
                    onClick={() => navigate(`/record/${encodeURIComponent(row.id)}`)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') navigate(`/record/${encodeURIComponent(row.id)}`)
                    }}
                    tabIndex={0}
                  >
                    {columns.map((column) => (
                      <td key={column.key} className={column.className}>
                        {column.render(row, today)}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 ? (
        <div className="pager">
          <button type="button" className="btn btn-ghost" disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
            {t.back}
          </button>
          <span>
            {safePage + 1} / {pageCount}
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            disabled={safePage >= pageCount - 1}
            onClick={() => setPage(safePage + 1)}
          >
            {t.next}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function formatCellDate(value: string | null): string {
  if (!value) return '—'
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return value
  return `${match[3]}.${match[2]}.${match[1]}`
}
