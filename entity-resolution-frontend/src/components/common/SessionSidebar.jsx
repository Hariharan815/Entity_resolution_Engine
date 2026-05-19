import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
  Table,
  GitMerge,
  ScrollText,
} from 'lucide-react'
import clsx from 'clsx'
import useStore from '../../store/useStore'
import { useSessions } from '../../hooks/useSessions'
import { fmtDate } from '../../utils/formatters'

const STATUS_META = {
  Upload: 'bg-slate-400',
  Running: 'bg-indigo-400',
  Review: 'bg-amber-400',
  Done: 'bg-emerald-400',
}

const getCurrentSessionState = ({ isResolving, activeStep, reviewQueue, currentReviewIdx }) => {
  if (reviewQueue.length > 0 && currentReviewIdx >= reviewQueue.length) {
    return { label: 'Done', route: '/audit' }
  }
  if (isResolving || activeStep === 2) {
    return { label: 'Running', route: '/results' }
  }
  if (activeStep >= 3) {
    return { label: 'Review', route: '/review' }
  }
  return { label: 'Upload', route: '/upload' }
}

export default function SessionSidebar({
  collapsed,
  mobileOpen,
  onToggleCollapse,
  onCloseMobile,
}) {
  const navigate = useNavigate()
  const {
    reset,
    uploadedFile,
    activeStep,
    isResolving,
    reviewQueue,
    currentReviewIdx,
    auditLog,
    stats,
    restoreSessionSnapshot,
  } = useStore()
  const { sessions, renameSession, deleteSession, exportSessionCsv } = useSessions()

  const [search, setSearch] = useState('')
  const [menuOpenFor, setMenuOpenFor] = useState(null)

  const currentState = getCurrentSessionState({ isResolving, activeStep, reviewQueue, currentReviewIdx })

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter((s) => (s.filename || '').toLowerCase().includes(q))
  }, [sessions, search])

  const handleNewSession = () => {
    reset()
    navigate('/upload')
    onCloseMobile?.()
  }

  const handleRestoreSession = (session) => {
    restoreSessionSnapshot(session)
    navigate('/results')
    onCloseMobile?.()
  }

  const handleRename = (session) => {
    const nextName = window.prompt('Rename session', session.filename || 'Untitled Session')
    if (nextName) renameSession(session.id, nextName)
    setMenuOpenFor(null)
  }

  const handleDelete = (session) => {
    const ok = window.confirm(`Delete session "${session.filename || 'Untitled Session'}"?`)
    if (ok) deleteSession(session.id)
    setMenuOpenFor(null)
  }

  const handleExport = (session) => {
    exportSessionCsv(session)
    setMenuOpenFor(null)
  }

  const panelClass = clsx(
    'fixed left-0 top-16 z-40 flex flex-col h-[calc(100vh-64px)] bg-white text-slate-700 border-r border-slate-200 transition-all duration-300 shadow-sm',
    collapsed ? 'w-14' : 'w-64'
  )

  const contentClass = clsx(
    'fixed top-16 left-0 z-50 md:hidden w-64 h-[calc(100vh-64px)] bg-white border-r border-slate-200 transition-transform duration-300 shadow-lg',
    mobileOpen ? 'translate-x-0' : '-translate-x-full'
  )

  return (
    <>
      <aside className={clsx(panelClass, 'hidden md:flex')}>
        <div className="h-full flex flex-col px-4 py-4 gap-3">
          <div className="flex justify-between items-center w-full">
            {!collapsed && <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 px-2">Sessions</p>}
            <button
              type="button"
              onClick={onToggleCollapse}
              className="w-8 h-8 rounded-md hover:bg-indigo-50 text-slate-500 transition-colors flex items-center justify-center"
            >
              {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
            </button>
          </div>

          <button
            type="button"
            onClick={handleNewSession}
            className={clsx(
              'w-full px-4 py-2.5 inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors',
              collapsed && 'px-0'
            )}
            title="New Session"
          >
            <Plus size={16} />
            {!collapsed && 'New Session'}
          </button>

          {!collapsed && (
            <div className="relative mt-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sessions..."
                className="input py-1.5 text-sm pl-9 rounded-md"
              />
            </div>
          )}

          {!collapsed && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 px-2 mb-2 mt-5">Current Session</p>
              <button
                type="button"
                onClick={() => navigate(currentState.route)}
                className="w-full text-left hover:bg-indigo-50 rounded-md px-3 py-2 transition-colors mt-2 mb-1"
              >
                <div className="flex items-center gap-2">
                  <span className={clsx('w-2 h-2 rounded-md', STATUS_META[currentState.label])} />
                  <p className="text-sm font-medium text-slate-800 truncate">
                    {uploadedFile?.name || 'Untitled Session'}
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-1">{currentState.label}</p>
              </button>
            </div>
          )}

          {!collapsed && (
            <div className="mt-2 flex-1 overflow-y-auto">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 px-2 mb-2 mt-5">Recent Sessions</p>
              <div className="space-y-1">
                {filteredSessions.map((session) => (
                  <div key={session.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => handleRestoreSession(session)}
                      className="w-full text-left hover:bg-indigo-50 rounded-md px-3 py-2.5 cursor-pointer transition-colors mt-2 mb-1"
                    >
                      <p className="text-sm text-slate-800 font-medium truncate max-w-[160px]">{session.filename || 'Untitled Session'}</p>
                      <p className="text-xs text-slate-500 font-mono">{fmtDate(session.date)}</p>
                      <span className="mt-1 inline-flex text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700">
                        {'-> '}{(session.stats?.golden ?? session.goldenRecords?.length ?? 0)} golden
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMenuOpenFor((id) => (id === session.id ? null : session.id))}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-7 h-7 rounded-md hover:bg-indigo-100 text-slate-500 transition"
                    >
                      <MoreHorizontal size={14} className="mx-auto" />
                    </button>

                    {menuOpenFor === session.id && (
                      <div className="absolute right-2 top-9 z-50 min-w-[120px] bg-white border border-slate-200 rounded-md shadow-lg py-1">
                        <button type="button" onClick={() => handleRename(session)} className="w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-indigo-50">
                          Rename
                        </button>
                        <button type="button" onClick={() => handleDelete(session)} className="w-full px-3 py-1.5 text-left text-sm text-rose-600 hover:bg-rose-50">
                          Delete
                        </button>
                        <button type="button" onClick={() => handleExport(session)} className="w-full px-3 py-1.5 text-left text-sm text-slate-700 hover:bg-indigo-50">
                          Export CSV
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {!filteredSessions.length && (
                  <p className="text-xs text-gray-400 italic px-2 py-1">No recent sessions</p>
                )}
              </div>
            </div>
          )}

          <div className={clsx('mt-2', !collapsed && 'pt-2')}>
            {!collapsed && (
              <>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 px-2 mb-2 mt-5">Quick Actions</p>
                <div className="space-y-1.5">
                  <button type="button" onClick={() => navigate('/upload')} className="btn-ghost w-full justify-start px-3 py-2 text-sm rounded-md">
                    <Upload size={14} /> Upload New Dataset
                  </button>
                  <button type="button" onClick={() => navigate('/results')} className="btn-ghost w-full justify-start px-3 py-2 text-sm rounded-md">
                    <Table size={14} /> View Golden Records
                  </button>
                  <button type="button" onClick={() => navigate('/review')} className="btn-ghost w-full justify-start px-3 py-2 text-sm rounded-md">
                    <GitMerge size={14} /> Review Queue
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 text-xs rounded-md bg-indigo-100 text-indigo-600 font-mono font-medium inline-flex items-center justify-center">{reviewQueue.length}</span>
                  </button>
                  <button type="button" onClick={() => navigate('/audit')} className="btn-ghost w-full justify-start px-3 py-2 text-sm rounded-md">
                    <ScrollText size={14} /> Audit Log
                    <span className="ml-auto min-w-[20px] h-5 px-1.5 text-xs rounded-md bg-indigo-100 text-indigo-600 font-mono font-medium inline-flex items-center justify-center">{auditLog.length}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="mt-auto text-xs text-slate-500 font-mono px-3 py-3 border-t border-slate-200">
            {stats ? (
              <div className="space-y-1">
                <p>records: {stats.original ?? 0}</p>
                <p>duplicates: {stats.duplicates_found ?? 0}</p>
              </div>
            ) : (
              <p className="text-xs text-gray-400 italic px-2 py-1">No active session</p>
            )}
          </div>
        </div>
      </aside>

      <div className={clsx('fixed top-16 inset-x-0 bottom-0 bg-slate-900/35 z-40 md:hidden transition-opacity duration-300', mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none')} onClick={onCloseMobile} />

      <aside className={contentClass}>
        <div className="h-full">
          <div className="p-2">
            <button
              type="button"
              onClick={onCloseMobile}
              className="w-8 h-8 rounded-md hover:bg-indigo-50 text-slate-500 transition-colors flex items-center justify-center"
            >
              <ChevronLeft size={16} />
            </button>
          </div>
          <div className="px-4 py-4 h-[calc(100%-40px)] overflow-y-auto">
            <button
              type="button"
              onClick={handleNewSession}
              className="w-full px-4 py-2.5 inline-flex items-center justify-center gap-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition-colors"
            >
              <Plus size={16} /> New Session
            </button>

            <div className="relative mt-2">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sessions..."
                className="input py-1.5 text-sm pl-9 rounded-md"
              />
            </div>

            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 px-2 mb-2 mt-5">Current Session</p>
            <button
              type="button"
              onClick={() => { navigate(currentState.route); onCloseMobile?.() }}
              className="w-full text-left hover:bg-indigo-50 rounded-md px-3 py-2.5 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className={clsx('w-2 h-2 rounded-md', STATUS_META[currentState.label])} />
                <p className="text-sm font-medium text-slate-800 truncate">{uploadedFile?.name || 'Untitled Session'}</p>
              </div>
              <p className="text-xs text-slate-500 mt-1">{currentState.label}</p>
            </button>

            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 px-2 mb-2 mt-5">Recent Sessions</p>
            <div className="space-y-1">
              {filteredSessions.map((session) => (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => handleRestoreSession(session)}
                  className="w-full text-left hover:bg-indigo-50 rounded-md px-3 py-2.5 cursor-pointer transition-colors"
                >
                  <p className="text-sm text-slate-800 font-medium truncate max-w-[160px]">{session.filename || 'Untitled Session'}</p>
                  <p className="text-xs text-slate-500 font-mono">{fmtDate(session.date)}</p>
                  <span className="mt-1 inline-flex text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700">
                    {'-> '}{(session.stats?.golden ?? session.goldenRecords?.length ?? 0)} golden
                  </span>
                </button>
              ))}
              {!filteredSessions.length && (
                <p className="text-xs text-gray-400 italic px-2 py-1">No recent sessions</p>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
