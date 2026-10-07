import assert from 'node:assert/strict'
import { test } from 'node:test'
import { formatDate } from '../src/lib/format.ts'
import { returnPath } from '../src/lib/navigation.ts'

test('UTC date-only chart labels do not move to yesterday in western timezones', () => {
  const previousTimezone = process.env.TZ
  process.env.TZ = 'America/Los_Angeles'
  try {
    assert.equal(formatDate('2026-10-07'), 'Oct 7')
    assert.equal(formatDate('2026-10-07', { day: 'numeric' }), '7')
    assert.equal(formatDate('2026-10-07T00:00:00Z'), 'Oct 6')
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ
    else process.env.TZ = previousTimezone
  }
})

test('protected-page return paths keep internal destinations and reject external/auth loops', () => {
  assert.equal(returnPath({ from: '/vocabulary?topicId=example' }), '/vocabulary?topicId=example')
  for (const from of [
    'https://example.test',
    '//example.test',
    '/login',
    '/register?from=/login',
  ]) {
    assert.equal(returnPath({ from }), '/')
  }
  assert.equal(returnPath(null), '/')
})
