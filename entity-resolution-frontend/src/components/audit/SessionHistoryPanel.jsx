import { MessageSquare, Clock3, FileText } from 'lucide-react'
import clsx from 'clsx'
import { fmtDate } from '../../utils/formatters'

const Bubble = ({ role, text, ts }) => {
  const isUser = role === 'user'
  return (
    <div className={clsx('flex', isUser ? 'justify-end' : 'justify-start')}>
      <div className={clsx(
        'max-w-[88%] rounded-2xl px-3.5 py-2.5 text-sm border',
        isUser
          ? 'bg-indigo-50 border-indigo-200 text-slate-800'
          : 'bg-white border-slate-200 text-slate-700'
      )}>
        <p className="leading-relaxed">{text}</p>
        <p className="mt-1 text-[10px] text-slate-500 font-mono">{fmtDate(ts)}</p>
      </div>
    </div>
  )
}

export default function SessionHistoryPanel({ sessions = [], selectedId, onSelect }) {
  const active = sessions.find((s) => s.id === selectedId) || sessions[0]

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] min-h-[430px]">
        <aside className="border-r border-slate-200 bg-slate-50/70">
          <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-2">
            <MessageSquare size={15} className="text-indigo-600" />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-600">Previous Sessions</p>
          </div>
          <div className="max-h-[370px] overflow-y-auto p-2 space-y-1.5">
            {sessions.length === 0 && (
              <div className="px-3 py-6 text-center text-xs text-slate-500">
                No session history yet.
              </div>
            )}
            {sessions.map((session) => {
              const isActive = (active?.id || '') === session.id
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => onSelect?.(session.id)}
                  className={clsx(
                    'w-full text-left rounded-xl border px-3 py-2.5 transition-all duration-150',
                    isActive
                      ? 'bg-indigo-50 border-indigo-300'
                      : 'bg-white border-slate-200 hover:border-indigo-200 hover:bg-indigo-50'
                  )}
                >
                  <p className="text-sm font-medium text-slate-800 truncate">{session.title}</p>
                  <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500">
                    <Clock3 size={11} />
                    <span>{fmtDate(session.updatedAt)}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </aside>

        <section className="flex flex-col min-h-[430px]">
          <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-display text-base text-slate-900 truncate">{active?.title || 'Session History'}</p>
              <p className="text-xs text-slate-500 truncate">{active?.fileName || 'Upload a CSV to start a new session'}</p>
            </div>
            {active?.stats && (
              <div className="hidden sm:flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                <span className="px-2 py-1 rounded-full bg-white border border-slate-200">Original: {active.stats.original ?? 0}</span>
                <span className="px-2 py-1 rounded-full bg-white border border-slate-200">Golden: {active.stats.golden ?? 0}</span>
                <span className="px-2 py-1 rounded-full bg-white border border-slate-200">Acc: {typeof active.stats.accuracy === 'number' ? active.stats.accuracy.toFixed(2) : '0.00'}</span>
              </div>
            )}
          </div>

          <div className="flex-1 p-4 space-y-2.5 max-h-[360px] overflow-y-auto bg-slate-50/40">
            {!active?.messages?.length && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-sm gap-2">
                <FileText size={18} className="text-slate-500" />
                <p>Session events will appear here like a chat history.</p>
              </div>
            )}
            {active?.messages?.map((msg, idx) => (
              <Bubble
                key={`${active.id}-${idx}`}
                role={msg.role}
                text={msg.text}
                ts={msg.ts}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
