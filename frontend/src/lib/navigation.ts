export function returnPath(state: unknown): string {
  if (!state || typeof state !== 'object' || !('from' in state)) return '/'
  const from = state.from
  if (
    typeof from !== 'string' ||
    !from.startsWith('/') ||
    from.startsWith('//') ||
    /^\/(login|register)(?:[/?#]|$)/.test(from)
  )
    return '/'
  return from
}
