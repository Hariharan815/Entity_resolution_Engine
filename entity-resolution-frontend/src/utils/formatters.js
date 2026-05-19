// formatters.js
export const fmtScore = (score) => `${(score * 100).toFixed(0)}%`

export const fmtDate = (iso) =>
  new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })

export const fmtNum = (n) =>
  n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n)

export const scoreColor = (score) => {
  if (score >= 0.85) return 'badge-green'
  if (score >= 0.50) return 'badge-amber'
  return 'badge-red'
}

export const scoreLabel = (score) => {
  if (score >= 0.85) return 'Auto-merged'
  if (score >= 0.50) return 'Review needed'
  return 'No match'
}

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
