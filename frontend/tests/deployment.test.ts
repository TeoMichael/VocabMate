import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateHostedApiUrl } from '../src/lib/deployment.ts'

test('hosted frontend accepts a public HTTPS API base URL', () => {
  assert.doesNotThrow(() => validateHostedApiUrl('https://vocabmate-api.example.test/api'))
  assert.doesNotThrow(() => validateHostedApiUrl('https://vocabmate-api.example.test/api/'))
})

test('hosted frontend rejects missing, local, insecure, and credential-bearing API configuration', () => {
  for (const value of [
    undefined,
    '',
    'not a URL',
    'http://api.example.test/api',
    'https://localhost/api',
    'https://127.0.0.1/api',
    'https://[::1]/api',
    'https://api.example.test',
    'https://user:password@api.example.test/api',
    'https://api.example.test/api?token=example',
    'https://api.example.test/api#fragment',
  ]) {
    assert.throws(() => validateHostedApiUrl(value), /VITE_API_URL/)
  }
})
