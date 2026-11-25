import assert from 'node:assert/strict'
import { test } from 'node:test'
import { DEFAULT_LOCALE, LOCALES, isLocale } from './locales.ts'
import { catalogLabel, entityLabel, formatCatalogLabel, getMessages, recordsWord } from './index.ts'

test('only Ukrainian and Slovak are enabled, default is uk', () => {
  assert.deepEqual([...LOCALES], ['uk', 'sk'])
  assert.equal(DEFAULT_LOCALE, 'uk')
  assert.equal(isLocale('uk'), true)
  assert.equal(isLocale('sk'), true)
  assert.equal(isLocale('pl'), false)
  assert.equal(isLocale('en'), false)
})

test('Slovak catalog has the same message keys as Ukrainian', () => {
  const uk = getMessages('uk')
  const sk = getMessages('sk')
  assert.deepEqual(Object.keys(sk), Object.keys(uk))
  assert.equal(typeof sk.auth.rateLimit, 'string')
  assert.ok(sk.auth.rateLimit.length > 10)
  assert.match(uk.auth.sent, /Спам/)
  assert.match(sk.auth.sent, /Spam/)
})

test('group labels map language_group codes in both locales', () => {
  assert.equal(catalogLabel('українськомовні', 'uk'), 'Українськомовні')
  assert.equal(catalogLabel('українськомовні', 'sk'), 'Ukrajinsky hovoriace')
  assert.equal(catalogLabel('Ukrainian', 'sk'), 'Ukrajinsky hovoriace')
  assert.equal(catalogLabel('словацькі', 'sk'), 'Slovenské')
  assert.equal(catalogLabel('Not applicable', 'sk'), 'Iné / nie komunity')
  assert.equal(formatCatalogLabel('сайт/медіа', 'uk'), 'Сайт / медіа')
  assert.equal(formatCatalogLabel('сайт/медіа', 'sk'), 'Web / médiá')
  assert.equal(entityLabel('staffing agency', 'sk'), 'Agentúra práce')
})

test('record word follows Slavic plural rules', () => {
  assert.equal(recordsWord(1, 'uk'), 'запис')
  assert.equal(recordsWord(2, 'uk'), 'записи')
  assert.equal(recordsWord(5, 'uk'), 'записів')
  assert.equal(recordsWord(11, 'uk'), 'записів')
  assert.equal(recordsWord(22, 'uk'), 'записи')
  assert.equal(recordsWord(1, 'sk'), 'záznam')
  assert.equal(recordsWord(2, 'sk'), 'záznamy')
  assert.equal(recordsWord(5, 'sk'), 'záznamov')
  assert.equal(recordsWord(11, 'sk'), 'záznamov')
  assert.equal(recordsWord(22, 'sk'), 'záznamy')
})
