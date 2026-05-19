import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronLeft,
  Database,
  Folder,
  MoreHorizontal,
  Plus,
  Search,
  Upload,
  Table,
  GitMerge,
  ScrollText,
  LogIn,
  UserPlus,
  Settings,
  Zap,
  LogOut,
} from 'lucide-react'
import clsx from 'clsx'
import useStore from '../../store/useStore'
import { getSessions, deleteSession, renameSession } from '../../hooks/useSessions'

const getStepState = ({ activeStep, isResolving, reviewQueue, currentReviewIdx }) => {
  if (reviewQueue.length > 0 && currentReviewIdx >= reviewQueue.length) {
    return { name: 'Done', path: '/audit' }
  }
  if (isResolving) return { name: 'Running', path: '/results' }
  if (activeStep >= 3) return { name: 'Review', path: '/review' }
  if (activeStep >= 2) return { name: 'Running', path: '/results' }
  return { name: 'Upload', path: '/upload' }
}

export default function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()

  const {
    sidebarOpen,
    toggleSidebar,
    uploadedFile,
    uploadedFiles,
    reviewQueue,
    currentReviewIdx,
    auditLog,
    activeStep,
    isResolving,
    stats,
    reset,
    restoreSession,
    user,
    openAuthModal,
    clearUser,
    setUser,
    currentSessionId,
  } = useStore()

  const [sessions, setSessions] = useState([])
  const [search, setSearch] = useState('')
  const [menuOpenId, setMenuOpenId] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [renameValue, setRenameValue] = useState('')
  const [authMenuOpen, setAuthMenuOpen] = useState(false)

  useEffect(() => {
    setSessions(getSessions())
  }, [currentSessionId])

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sessions
    return sessions.filter((s) => (s.name || '').toLowerCase().includes(q))
  }, [sessions, search])

  const stepState = getStepState({ activeStep, isResolving, reviewQueue, currentReviewIdx })

  const quickActions = [
    { label: 'Upload New Dataset', icon: Upload, path: '/upload', count: 0 },
    { label: 'View Golden Records', icon: Table, path: '/results', count: 0 },
    { label: 'Review Queue', icon: GitMerge, path: '/review', count: reviewQueue.length },
    { label: 'Audit Log', icon: ScrollText, path: '/audit', count: auditLog.length },
  ]

  const refreshSessions = () => setSessions(getSessions())

  const handleNewSession = () => {
    reset()
    navigate('/upload')
  }

  const handleRestore = (session) => {
    restoreSession(session)
    navigate('/results')
  }

  const beginRename = (session) => {
    setRenamingId(session.id)
    setRenameValue(session.name || '')
    setMenuOpenId(null)
  }

  const commitRename = () => {
    if (!renamingId) return
    const nextName = renameValue.trim()
    if (nextName) {
      renameSession(renamingId, nextName)
      refreshSessions()
    }
    setRenamingId(null)
    setRenameValue('')
  }

  const handleDelete = (id) => {
    deleteSession(id)
    refreshSessions()
    setMenuOpenId(null)
  }

  const handleSignOut = () => {
    clearUser()
    setAuthMenuOpen(false)
  }

  return (
    <>
      <div
        className={clsx(
          'fixed inset-0 z-30 bg-black/30 md:hidden transition-opacity duration-300',
          sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
        onClick={toggleSidebar}
      />

      <aside
        className={clsx(
          'flex flex-col h-screen bg-white border-r border-gray-200 fixed left-0 top-0 z-40 transition-all duration-300',
          sidebarOpen ? 'w-64' : 'w-14',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        )}
      >
        <div className="border-b border-gray-100 px-3 py-4 flex-shrink-0">
          <div className={clsx('flex w-full items-center', sidebarOpen ? 'justify-between' : 'justify-center')}>
            {sidebarOpen && (
              <div className="flex items-center gap-2 pl-2">
                <Database size={16} className="text-indigo-600" />
                <span className="text-sm font-bold text-gray-900">EntityRE</span>
              </div>
            )}
            <button
              type="button"
              onClick={toggleSidebar}
              className={clsx(
                'w-8 h-8 rounded-none hover:bg-gray-100 text-gray-500 flex items-center justify-center transition-transform duration-300',
                !sidebarOpen && 'rotate-180'
              )}
            >
              <ChevronLeft size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          <button
            type="button"
            onClick={handleNewSession}
            className={clsx(
              'bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors flex items-center gap-2 rounded-none',
              sidebarOpen ? 'w-full px-4 py-2.5 justify-center' : 'w-10 h-10 mx-auto justify-center'
            )}
            title="New Session"
          >
            <Plus size={15} />
            {sidebarOpen && <span>New Session</span>}
          </button>

          {sidebarOpen && (
            <div className="relative mt-3">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search sessions..."
                className="w-full border border-gray-200 rounded-md bg-gray-50 pl-8 pr-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}

          {sidebarOpen && (
            <>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 px-1 mb-2 mt-5">Current Session</p>
              <button
                type="button"
                onClick={() => navigate(stepState.path)}
                className="w-full bg-indigo-50 border border-indigo-100 rounded-md px-2 py-2 text-left mt-2 mb-1"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-md bg-indigo-500" />
                  <p className="text-xs font-medium text-gray-800 truncate">{uploadedFiles?.length > 1 ? `${uploadedFiles.length} datasets` : (uploadedFile?.name || 'Untitled Session')}</p>
                </div>
                <p className="text-[10px] text-gray-500 mt-1">{stepState.name}</p>
              </button>

              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 px-1 mb-2 mt-5">Recent Sessions</p>
              <div className="space-y-1">
                {filteredSessions.map((session) => (
                  <div key={session.id} className="group relative">
                    <div
                      onClick={() => handleRestore(session)}
                      className="rounded-md px-2 py-2 hover:bg-gray-50 cursor-pointer transition-colors mt-2 mb-1"
                    >
                      <div className="flex items-start gap-2">
                        <Folder size={13} className="text-gray-400 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          {renamingId === session.id ? (
                            <input
                              value={renameValue}
                              onChange={(e) => setRenameValue(e.target.value)}
                              onBlur={commitRename}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename()
                                if (e.key === 'Escape') {
                                  setRenamingId(null)
                                  setRenameValue('')
                                }
                              }}
                              autoFocus
                              className="w-full text-xs border border-indigo-200 rounded-md px-2 py-1"
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <p className="text-xs font-medium text-gray-800 truncate">{session.name}</p>
                          )}
                          <p className="text-[10px] font-mono text-gray-400">{new Date(session.date).toLocaleDateString()}</p>
                          <p className="text-[10px] text-gray-500 mt-0.5">→ {session?.stats?.golden ?? 0} golden</p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setMenuOpenId((prev) => (prev === session.id ? null : session.id))
                      }}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md hover:bg-gray-100 text-gray-500"
                    >
                      <MoreHorizontal size={13} className="mx-auto" />
                    </button>

                    {menuOpenId === session.id && (
                      <div className="absolute top-8 right-2 z-50 bg-white border border-gray-200 rounded-md shadow-lg py-1 min-w-[110px]">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            beginRename(session)
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50"
                        >
                          Rename
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(session.id)
                          }}
                          className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                ))}
                {filteredSessions.length === 0 && <p className="text-xs text-gray-400 italic px-2 py-1">No recent sessions</p>}
              </div>

              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 px-1 mb-2 mt-5">Quick Actions</p>
              <div className="space-y-1">
                {quickActions.map((action) => {
                  const active = location.pathname === action.path
                  const Icon = action.icon
                  return (
                    <button
                      key={action.path}
                      type="button"
                      onClick={() => navigate(action.path)}
                      className={clsx(
                        'w-full flex items-center px-3 py-2 rounded-none text-xs transition-colors',
                        active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
                      )}
                    >
                      <Icon size={14} className="mr-2" />
                      <span className="truncate">{action.label}</span>
                      {action.count > 0 && (
                        <span className="ml-auto min-w-[20px] h-5 px-1.5 text-[10px] rounded-sm bg-indigo-100 text-indigo-600 font-mono font-medium inline-flex items-center justify-center">
                          {action.count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </>
          )}

          {!sidebarOpen && (
            <div className="mt-4 space-y-2">
              {quickActions.map((action) => {
                const Icon = action.icon
                const active = location.pathname === action.path
                return (
                  <button
                    key={action.path}
                    type="button"
                    onClick={() => navigate(action.path)}
                    title={action.label}
                    className={clsx(
                      'relative w-10 h-10 rounded-none mx-auto flex items-center justify-center transition-colors',
                      active ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                    )}
                  >
                    <Icon size={15} />
                    {action.count > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-500" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {sidebarOpen && stats && (
          <div className="border-t border-gray-100 px-4 py-3 flex-shrink-0">
            <div className="grid grid-cols-3 divide-x divide-gray-200">
              <div className="text-center pr-2">
                <p className="text-xs font-bold text-gray-800">{stats.original ?? 0}</p>
                <p className="text-[10px] text-gray-400">Total</p>
              </div>
              <div className="text-center px-2">
                <p className="text-xs font-bold text-indigo-600">{stats.golden ?? 0}</p>
                <p className="text-[10px] text-gray-400">Golden</p>
              </div>
              <div className="text-center pl-2">
                <p className="text-xs font-bold text-amber-600">{stats.duplicates_found ?? 0}</p>
                <p className="text-[10px] text-gray-400">Duplicates</p>
              </div>
            </div>
          </div>
        )}

        <div className="border-t border-gray-200 flex-shrink-0 relative px-3 py-3">
          {!user && (
            <>
              {sidebarOpen && (
                <p className="text-[10px] text-gray-400 text-center mb-2.5">Sign in to save sessions across devices</p>
              )}

              {sidebarOpen ? (
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => openAuthModal('login')}
                    className="w-full rounded-none text-xs font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-2"
                  >
                    <LogIn size={13} /> Log In
                  </button>
                  <button
                    type="button"
                    onClick={() => openAuthModal('signup')}
                    className="w-full rounded-none text-xs font-semibold px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <UserPlus size={13} /> Sign Up
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="w-10 h-10 bg-indigo-600 rounded-none mx-auto flex items-center justify-center text-white"
                  title="Log In"
                >
                  <LogIn size={15} />
                </button>
              )}
            </>
          )}

          {user && (
            <>
              {sidebarOpen ? (
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center">
                    {user.initials || 'U'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1">
                      <span className={clsx('w-1.5 h-1.5 rounded-full', user.plan === 'Pro' ? 'bg-emerald-400' : 'bg-gray-400')} />
                      {user.plan || 'Free'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAuthMenuOpen((v) => !v)}
                    className="w-7 h-7 rounded-none hover:bg-gray-100 text-gray-500"
                  >
                    <MoreHorizontal size={14} className="mx-auto" />
                  </button>
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white text-xs font-bold mx-auto flex items-center justify-center">
                  {user.initials || 'U'}
                </div>
              )}

              {sidebarOpen && authMenuOpen && (
                <div className="absolute bottom-full left-3 right-3 mb-2 bg-white border border-gray-200 rounded-md shadow-lg py-1">
                  <button type="button" className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                    <Settings size={12} /> Account Settings
                  </button>
                  {(user.plan || 'Free') === 'Free' && (
                    <button
                      type="button"
                      onClick={() => {
                        setUser({ ...user, plan: 'Pro' })
                        setAuthMenuOpen(false)
                      }}
                      className="w-full px-3 py-1.5 text-left text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-2"
                    >
                      <Zap size={12} /> Upgrade to Pro
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                  >
                    <LogOut size={12} /> Sign Out
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </aside>
    </>
  )
}
