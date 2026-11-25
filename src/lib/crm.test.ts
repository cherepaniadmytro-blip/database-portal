import assert from 'node:assert/strict'
import test from 'node:test'
import {
  PIPELINE_RELATIONS,
  computeTeamStats,
  displayMemberName,
  memberDisplayName,
  defaultTemplate,
  effectiveRelation,
  fillTemplate,
  groupByStatus,
  parseMarks,
  parseWorkflow,
  statusTone,
  type Interaction,
  type WorkflowRow,
} from './crm.ts'

test('status colours follow red-to-green progression', () => {
  assert.equal(statusTone('new'), 'neutral')
  assert.equal(statusTone('started'), 'red')
  assert.equal(statusTone('reviewed'), 'orange')
  assert.equal(statusTone('contacted'), 'yellow')
  assert.equal(statusTone('replied'), 'blue')
  assert.equal(statusTone('working'), 'green')
  assert.equal(statusTone('declined'), 'grey')
})

test('team relation overrides the suggestion and legacy statuses normalize cleanly', () => {
  const wf = parseWorkflow({
    record_id: 'A',
    relation_type: 'partner',
    status: 'contacted',
    marks: ['joined_group', 'bogus_mark', 'in_telegram'],
  }) as WorkflowRow
  assert.equal(effectiveRelation('client', wf), 'partner')
  assert.equal(effectiveRelation('client', undefined), 'client')
  assert.deepEqual(wf.marks, ['joined_group', 'in_telegram'])
  assert.equal(parseWorkflow({ record_id: 'B', status: 'bogus' })?.status, 'new')
  assert.equal(parseWorkflow({ record_id: 'C', status: 'selected' })?.status, 'started')
  assert.equal(parseWorkflow({ record_id: 'D', status: 'draft_ready' })?.status, 'reviewed')
  assert.equal(parseWorkflow({ record_id: 'E', status: 'agreed' })?.status, 'working')
  assert.deepEqual(parseMarks(['in_telegram', 'called', 'called']), ['called', 'in_telegram'])
})

test('pipeline includes all 5 relation types and moves a record when its type is ticked', () => {
  assert.deepEqual([...PIPELINE_RELATIONS], ['client', 'partner', 'media', 'job', 'info'])
  const rows = [{ id: 'A', rel: 'client' as const }, { id: 'B', rel: 'media' as const }, { id: 'C', rel: null }]
  const wfs = new Map<string, WorkflowRow>()
  wfs.set('B', parseWorkflow({ record_id: 'B', relation_type: 'client', status: 'contacted' }) as WorkflowRow)
  wfs.set('C', parseWorkflow({ record_id: 'C', relation_type: 'info', status: 'reviewed' }) as WorkflowRow)
  const cols = groupByStatus(rows, wfs, 'client', (row) => row.rel)
  assert.deepEqual(cols.new.map((i) => i.row.id), ['A'])
  assert.deepEqual(cols.contacted.map((i) => i.row.id), ['B'])
  const media = groupByStatus(rows, wfs, 'media', (row) => row.rel)
  assert.equal(Object.values(media).flat().length, 0)
  const info = groupByStatus(rows, wfs, 'info', (row) => row.rel)
  assert.deepEqual(info.reviewed.map((i) => i.row.id), ['C'])
})

test('computeTeamStats aggregates per-member status, mark, and letter/reply counts', () => {
  const team = [
    { id: 'u1', email: 'dmytro@example.com', role: 'owner' },
    { id: 'u2', email: 'samuel@example.com', role: 'partner' },
  ]
  const wfs = new Map<string, WorkflowRow>()
  wfs.set(
    'R1',
    parseWorkflow({
      record_id: 'R1',
      status: 'contacted',
      assigned_to: 'u2',
      marks: ['joined_group', 'letter_sent'],
    }) as WorkflowRow,
  )
  wfs.set(
    'R2',
    parseWorkflow({
      record_id: 'R2',
      status: 'working',
      assigned_to: 'u1',
      marks: ['in_telegram'],
    }) as WorkflowRow,
  )
  const interactions: Interaction[] = [
    {
      id: 1,
      recordId: 'R1',
      authorId: 'u2',
      authorEmail: 'samuel@example.com',
      createdAt: '2026-11-25T10:00:00Z',
      direction: 'out',
      channel: 'facebook',
      summary: 'Sent message to admin',
      nextStep: null,
    },
    {
      id: 2,
      recordId: 'R1',
      authorId: 'u2',
      authorEmail: 'samuel@example.com',
      createdAt: '2026-11-25T11:00:00Z',
      direction: 'in',
      channel: 'facebook',
      summary: 'Admin replied OK',
      nextStep: 'Post on Friday',
    },
  ]
  const stats = computeTeamStats(wfs, interactions, team)
  const dmytro = stats.members.find((m) => m.id === 'u1')!
  const samuel = stats.members.find((m) => m.id === 'u2')!
  assert.equal(dmytro.taken, 1)
  assert.equal(dmytro.byStatus.working, 1)
  assert.equal(dmytro.byMark.in_telegram, 1)
  assert.equal(samuel.taken, 1)
  assert.equal(samuel.byStatus.contacted, 1)
  assert.equal(samuel.lettersOut, 1)
  assert.equal(samuel.repliesIn, 1)
  assert.equal(samuel.byMark.joined_group, 1)
  assert.equal(stats.totals.taken, 2)
  assert.equal(stats.totals.lettersOut, 1)
  assert.equal(stats.totals.repliesIn, 1)
})

test('templates fill placeholders in uk, sk, and de without inventing missing values', () => {
  const uk = fillTemplate('partner_org', 'uk', { name: 'Vitsche e.V.', city: 'Berlin', languageGroup: 'Ukrainian' })
  assert.match(uk, /«Vitsche e\.V\.»/)
  assert.match(uk, /у Berlin, які говорять українською/)
  assert.match(uk, /^Добрий день! /)
  assert.match(uk, /\[ваше імʼя\]/)
  assert.doesNotMatch(uk, /\{\{/)
  const sk = fillTemplate('community', 'sk', { name: 'Slováci v Nemecku', city: 'München', languageGroup: 'Slovak', senderName: 'Samuel' })
  assert.match(sk, /Dobrý deň, volám sa Samuel/)
  assert.match(sk, /po slovensky/)
  assert.doesNotMatch(sk, /\{\{/)
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

test('displayMemberName & memberDisplayName prefer explicit display_name over email', () => {
  const team = [
    { id: 'u1', email: 's.kovac@agency.sk', role: 'partner', display_name: 'Samuel' },
    { id: 'u2', email: 'max.berlin@example.com', role: 'partner', display_name: null },
  ]
  assert.equal(displayMemberName('s.kovac@agency.sk', 'Samuel'), 'Samuel')
  assert.equal(displayMemberName('max.berlin@example.com', null), 'max.berlin')
  assert.equal(memberDisplayName(team, 'u1'), 'Samuel')
  assert.equal(memberDisplayName(team, 'u2'), 'max.berlin')
  assert.equal(memberDisplayName(team, null, 's.kovac@agency.sk'), 'Samuel')
  const stats = computeTeamStats(new Map(), [], team)
  assert.equal(stats.members[0].displayName, 'Samuel')
  assert.equal(stats.members[1].displayName, 'max.berlin')
})
