import assert from 'node:assert/strict'
import test from 'node:test'
import { defaultTemplate, effectiveRelation, fillTemplate, groupByStatus, parseWorkflow, statusTone, type WorkflowRow } from './crm.ts'

test('status colours follow the owner request', () => {
  assert.equal(statusTone('selected'), 'red')
  assert.equal(statusTone('draft_ready'), 'yellow')
  assert.equal(statusTone('contacted'), 'blue')
  assert.equal(statusTone('replied'), 'green')
  assert.equal(statusTone('agreed'), 'green')
  assert.equal(statusTone('declined'), 'grey')
  assert.equal(statusTone('new'), 'neutral')
})

test('team relation overrides the suggestion', () => {
  const wf = parseWorkflow({ record_id: 'A', relation_type: 'partner', status: 'contacted' }) as WorkflowRow
  assert.equal(effectiveRelation('client', wf), 'partner')
  assert.equal(effectiveRelation('client', undefined), 'client')
  assert.equal(parseWorkflow({ record_id: 'B', status: 'bogus' })?.status, 'new')
})

test('pipeline groups by status and moves a record when its type is ticked', () => {
  const rows = [{ id: 'A', rel: 'client' as const }, { id: 'B', rel: 'media' as const }, { id: 'C', rel: null }]
  const wfs = new Map<string, WorkflowRow>()
  wfs.set('B', parseWorkflow({ record_id: 'B', relation_type: 'client', status: 'contacted' }) as WorkflowRow)
  const cols = groupByStatus(rows, wfs, 'client', (row) => row.rel)
  assert.deepEqual(cols.new.map((i) => i.row.id), ['A'])
  assert.deepEqual(cols.contacted.map((i) => i.row.id), ['B'])
  const media = groupByStatus(rows, wfs, 'media', (row) => row.rel)
  assert.equal(Object.values(media).flat().length, 0)
})

test('templates fill placeholders and never invent missing values', () => {
  const uk = fillTemplate('partner_org', 'uk', { name: 'Vitsche e.V.', city: 'Berlin', languageGroup: 'Ukrainian' })
  assert.match(uk, /«Vitsche e\.V\.»/)
  assert.match(uk, /у Berlin, які говорять українською/)
  assert.match(uk, /^Добрий день! /)
  assert.match(uk, /\[ваше імʼя\]/)
  assert.doesNotMatch(uk, /\{\{/)
  const de = fillTemplate('media', 'de', { name: 'X', city: null, languageGroup: 'Slovak', contactName: 'Jana', senderName: 'Dmytro' })
  assert.match(de, /Slowakisch sprechen/)
  assert.match(de, /ich bin Dmytro/)
  const withContact = fillTemplate('community', 'uk', { name: 'G', city: null, languageGroup: null, contactName: 'Оксано' })
  assert.match(withContact, /^Добрий день, Оксано!/)
  assert.match(withContact, /\[мовою\]/)
})

test('default template follows relation and entity type', () => {
  assert.equal(defaultTemplate('client', 'Facebook group'), 'community')
  assert.equal(defaultTemplate('media', null), 'media')
  assert.equal(defaultTemplate('partner', 'Staffing agency'), 'agency')
  assert.equal(defaultTemplate('partner', 'Financial / tax consultant'), 'consultant')
  assert.equal(defaultTemplate('partner', 'Community organisation / NGO'), 'partner_org')
})
