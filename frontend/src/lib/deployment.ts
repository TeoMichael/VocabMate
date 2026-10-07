export function validateHostedApiUrl(value: string | undefined): void {
  let url: URL
  try {
    url = new URL(value || '')
  } catch {
    throw new Error('Set VITE_API_URL to the public HTTPS API base URL before deploying.')
  }
  const localHost =
    url.hostname === 'localhost' ||
    url.hostname.endsWith('.localhost') ||
    url.hostname.startsWith('127.') ||
    ['[::1]', '0.0.0.0'].includes(url.hostname)
  if (
    url.protocol !== 'https:' ||
    localHost ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname.replace(/\/$/, '') !== '/api'
  ) {
    throw new Error('VITE_API_URL must be a public HTTPS URL ending in /api, without credentials.')
  }
}
