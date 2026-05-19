const STORAGE_KEY = 'ere_sessions'
const MAX_SESSIONS = 10

const safeRead = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const safeWrite = (sessions) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
  } catch {
    // Ignore storage write failures to keep runtime stable.
  }
}

export const getSessions = () => safeRead()

export const saveSession = (session) => {
  const current = safeRead()
  const incoming = {
    id: session?.id,
    name: session?.name || 'Untitled Session',
    date: session?.date || new Date().toISOString(),
    filenames: Array.isArray(session?.filenames) ? session.filenames : [],
    stats: session?.stats || null,
    goldenRecords: Array.isArray(session?.goldenRecords) ? session.goldenRecords : [],
    duplicateGroups: Array.isArray(session?.duplicateGroups) ? session.duplicateGroups : [],
  }

  const withoutDuplicate = current.filter((s) => s.id !== incoming.id)
  const next = [incoming, ...withoutDuplicate].slice(0, MAX_SESSIONS)
  safeWrite(next)
  return next
}

export const deleteSession = (id) => {
  const next = safeRead().filter((s) => s.id !== id)
  safeWrite(next)
  return next
}

export const renameSession = (id, name) => {
  const cleanName = (name || '').trim()
  const next = safeRead().map((s) => (s.id === id ? { ...s, name: cleanName || s.name } : s))
  safeWrite(next)
  return next
}

export const generateSessionId = () => {
  const random = Math.random().toString(36).slice(2, 8)
  return `ses_${Date.now()}_${random}`
}

const sessionToCsv = (session) => {
  const rows = Array.isArray(session?.goldenRecords) ? session.goldenRecords : []
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  const lines = [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => `${row[key] ?? ''}`).join(',')),
  ]
  return lines.join('\n')
}

export const exportSessionCsv = (session) => {
  const csv = sessionToCsv(session)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${session?.name || 'session'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export const useSessions = () => {
  const sessions = getSessions()

  return {
    sessions,
    renameSession,
    deleteSession,
    exportSessionCsv,
  }
}
