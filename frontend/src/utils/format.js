export function fmtVal(n) {
  if (n == null || isNaN(n)) return '—'
  if (n >= 1000) return `$${(n / 1000).toFixed(2)}B`
  return `$${n.toFixed(2)}M`
}

export function fmtQty(n) {
  if (n == null || isNaN(n)) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M MT`
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K MT`
  return `${n.toFixed(1)} MT`
}

export const trunc = (s, n = 28) =>
  s?.length > n ? s.slice(0, n) + '…' : s
