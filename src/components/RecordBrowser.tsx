import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
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
import { StatusBadge } from './StatusBadge.tsx'

const PAGE_SIZE = 50

const DATE_FIELDS: { value: FilterState['dateField']; label: string }[] = [
  { value: 'date_added', label: 'Дата додавання' },
  { value: 'last_updated', label: 'Останнє оновлення' },
  { value: 'last_verified', label: 'Остання перевірка' },
]

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
      label: 'Назва',
      render: (row) => {
        const fresh = rowFreshness(row, today)
        return (
          <div className="name-cell">
            <span className="name-line">
              <span>{row.name}</span>
              {fresh === 'new' ? <span className="mark mark-new">Нове</span> : null}
              {fresh === 'updated' ? <span className="mark mark-updated">Оновлено</span> : null}
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
            label: 'Розділ',
            render: (row: RecordRow) => row.category,
          },
        ]
      : []),
    {
      key: 'subcategory',
      label: 'Підкатегорія',
      className: 'col-sub',
      render: (row) => <span className="clip-2">{row.subcategory || '—'}</span>,
    },
    {
      key: 'country',
      label: 'Країна',
      className: 'col-tight',
      render: (row) => row.country || '—',
    },
    {
      key: 'status',
      label: 'Статус',
      className: 'col-tight',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'priority',
      label: 'Пріоритет',
      className: 'col-num',
      render: (row) => row.priority || '—',
    },
    {
      key: 'potential',
      label: 'Потенціал',
      className: 'col-num',
      render: (row) => (row.potential == null ? '—' : String(row.potential)),
    },
    {
      key: 'date_added',
      label: 'Додано',
      className: 'col-date',
      render: (row) => formatCellDate(row.date_added),
    },
    {
      key: 'last_updated',
      label: 'Оновлено',
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
          <span>Пошук</span>
          <input
            value={filters.q}
            onChange={(event) => patch({ q: event.target.value })}
            placeholder="Назва, опис, країна, нотатки, ID"
            type="search"
          />
        </label>
        {showCategory && !lockCategory ? (
          <label className="field">
            <span>Розділ</span>
            <select value={filters.category} onChange={(event) => patch({ category: event.target.value })}>
              <option value="">Усі</option>
              {categories.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="field">
          <span>Статус</span>
          <select value={filters.status} onChange={(event) => patch({ status: event.target.value })}>
            <option value="">Усі</option>
            {statuses.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Пріоритет</span>
          <select value={filters.priority} onChange={(event) => patch({ priority: event.target.value })}>
            <option value="">Усі</option>
            {priorities.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Країна</span>
          <select value={filters.country} onChange={(event) => patch({ country: event.target.value })}>
            <option value="">Усі</option>
            {countries.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Поле дати</span>
          <select
            value={filters.dateField}
            onChange={(event) => {
              if (isDateField(event.target.value)) patch({ dateField: event.target.value })
            }}
          >
            {DATE_FIELDS.map((field) => (
              <option key={field.value} value={field.value}>
                {field.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>Від</span>
          <input type="date" value={filters.dateFrom} onChange={(event) => patch({ dateFrom: event.target.value })} />
        </label>
        <label className="field">
          <span>До</span>
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
          Скинути
        </button>
      </div>

      <div className="toolbar">
        <p className="toolbar-count">
          {sorted.length === scoped.length
            ? `${sorted.length} записів`
            : `${sorted.length} з ${scoped.length}`}
          {sorted.length > 0 ? ` · ${from}–${to}` : ''}
        </p>
        <p className="legend">
          <i className="swatch swatch-new" /> додано сьогодні
          <i className="swatch swatch-updated" /> оновлено сьогодні
        </p>
        <button type="button" className="btn btn-primary" onClick={exportCsv} disabled={sorted.length === 0}>
          Експорт CSV · {sorted.length}
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
                  Немає записів за цими умовами.
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
            Назад
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
            Далі
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
