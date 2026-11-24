import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  applyFilters,
  canSeeSection,
  dashboardCounts,
  isArchiveStatus,
  isNewToday,
  isUpdatedToday,
  parseDay,
  priorityWeight,
  rankScore,
  statusTone,
  todayISO,
  topRecords,
} from './records.ts'
import type { RecordRow } from './types.ts'

function row(partial: Partial<RecordRow> & Pick<RecordRow, 'id' | 'name' | 'category'>): RecordRow {
  return {
    sheet_category: null,
    subcategory: null,
    short_description: null,
    details_link: null,
    organization: null,
    country: null,
    city_region: null,
    language_community: null,
    website: null,
    public_contact: null,
    source: null,
    source_url: null,
    published_date: null,
    date_added: null,
    last_updated: null,
    last_verified: null,
    status: null,
    priority: null,
    reliability: null,
    potential: null,
    partner_type: null,
    next_action: null,
    responsible_agent: null,
    access_level: 'PUBLIC',
    pay_budget: null,
    requirements: null,
    hours_format: null,
    skill_fit: null,
    notes: null,
    duplicate_check: null,
    sheet_row: null,
    synced_at: '2026-11-24T00:00:00Z',
    ...partial,
  }
}

test('todayISO follows Europe/Bratislava', () => {
  assert.equal(todayISO(new Date('2026-11-24T22:30:00Z')), '2026-11-24')
  assert.equal(todayISO(new Date('2026-11-24T23:30:00Z')), '2026-11-25')
})

test('parseDay accepts ISO and Ukrainian dates and rejects impossible days', () => {
  assert.equal(parseDay('2026-11-24'), '2026-11-24')
  assert.equal(parseDay('2026-11-24 16:30'), '2026-11-24')
  assert.equal(parseDay('24.11.2026'), '2026-11-24')
  assert.equal(parseDay('2026-02-31'), null)
  assert.equal(parseDay(''), null)
})

test('status tones match the portal legend', () => {
  assert.equal(statusTone('VERIFIED'), 'green')
  assert.equal(statusTone('active'), 'green')
  assert.equal(statusTone('COMPLETED'), 'green')
  assert.equal(statusTone('NEW'), 'blue')
  assert.equal(statusTone('NEEDS REVIEW'), 'yellow')
  assert.equal(statusTone('IN_PROGRESS'), 'orange')
  assert.equal(statusTone('CONTACTED'), 'orange')
  assert.equal(statusTone('WAITING'), 'orange')
  assert.equal(statusTone('EXPIRED'), 'red')
  assert.equal(statusTone('ARCHIVED'), 'grey')
  assert.equal(isArchiveStatus('expired'), true)
  assert.equal(isArchiveStatus('VERIFIED'), false)
})

test('priority and potential form the ranking score', () => {
  assert.equal(priorityWeight('P1'), 5)
  assert.equal(priorityWeight('P3'), 3)
  assert.equal(priorityWeight('HIGH'), 5)
  const high = row({ id: '1', name: 'A', category: 'Jobs & Freelance', priority: 'P1', potential: 4 })
  const low = row({ id: '2', name: 'B', category: 'Jobs & Freelance', priority: 'P3', potential: 3 })
  assert.equal(rankScore(high), 54)
  assert.equal(rankScore(low), 33)
  assert.deepEqual(
    topRecords([low, high]).map((item) => item.id),
    ['1', '2'],
  )
})

test('dashboard counts use visible rows and Bratislava today', () => {
  const today = '2026-11-24'
  const rows = [
    row({
      id: 'j',
      name: 'Job',
      category: 'Jobs & Freelance',
      status: 'NEW',
      date_added: '2026-11-20',
      last_updated: '2026-11-24',
    }),
    row({
      id: 'p',
      name: 'Partner',
      category: 'Partners',
      status: 'ACTIVE',
      date_added: '2026-11-24',
      last_updated: '2026-11-24',
    }),
    row({
      id: 'b',
      name: 'Biz',
      category: 'Business Opportunities',
      status: 'VERIFIED',
      date_added: '2026-11-01',
      last_updated: '2026-11-02',
    }),
    row({
      id: 'm',
      name: 'Market',
      category: 'Market Research',
      status: 'VERIFIED',
      date_added: '2026-11-01',
      last_updated: '2026-11-24',
    }),
  ]
  assert.equal(isNewToday(rows[1]!, today), true)
  assert.equal(isUpdatedToday(rows[1]!, today), false)
  assert.equal(isUpdatedToday(rows[3]!, today), true)
  assert.deepEqual(dashboardCounts(rows, today), {
    total: 4,
    newToday: 1,
    updatedToday: 2,
    newJobs: 1,
    newPartners: 1,
    newOpportunities: 0,
  })
})

test('filters combine text, status and date range', () => {
  const rows = [
    row({
      id: '1',
      name: 'Albania citizenship AZR',
      category: 'Market Research',
      country: 'Germany',
      status: 'NEEDS REVIEW',
      date_added: '2026-11-24',
      notes: 'destatis',
    }),
    row({
      id: '2',
      name: 'Bulgarian citizens AZR',
      category: 'Market Research',
      country: 'Germany',
      status: 'VERIFIED',
      date_added: '2026-11-01',
    }),
  ]
  const filtered = applyFilters(rows, {
    q: 'albania',
    status: 'NEEDS REVIEW',
    priority: '',
    country: 'Germany',
    category: '',
    dateField: 'date_added',
    dateFrom: '2026-11-20',
    dateTo: '2026-11-24',
  })
  assert.deepEqual(
    filtered.map((item) => item.id),
    ['1'],
  )
})

test('section visibility follows the viewer role', () => {
  assert.equal(canSeeSection('public', 'public'), true)
  assert.equal(canSeeSection('partner', 'public'), false)
  assert.equal(canSeeSection('partner', 'partner'), true)
  assert.equal(canSeeSection('owner', 'partner'), false)
  assert.equal(canSeeSection('owner', 'owner'), true)
  assert.equal(canSeeSection('public', 'none'), false)
})
