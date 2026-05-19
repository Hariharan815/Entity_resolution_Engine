import { useNavigate } from 'react-router-dom'
import { ScrollText, Check, X, Scissors, SkipForward, ArrowRight } from 'lucide-react'
import AuditLog from '../components/audit/AuditLog'
import SessionHistoryPanel from '../components/audit/SessionHistoryPanel'
import { Button } from '../components/common/Button'
import { EmptyState } from '../components/common/Button'
import useStore from '../store/useStore'

export default function AuditPage() {
  const navigate = useNavigate()
  const { auditLog, sessionHistory, selectedSessionId, setSelectedSessionId } = useStore()

  const counts = auditLog.reduce((acc, e) => {
    acc[e.decision] = (acc[e.decision] || 0) + 1
    return acc
  }, {})

  const summary = [
    { label: 'Approved',  count: counts.approve || 0, icon: Check,       top: 'border-t-emerald-500', iconStyle: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    { label: 'Rejected',  count: counts.reject  || 0, icon: X,           top: 'border-t-rose-500',    iconStyle: 'text-rose-600 bg-rose-50 border-rose-100'         },
    { label: 'Split',     count: counts.split   || 0, icon: Scissors,    top: 'border-t-amber-500',   iconStyle: 'text-amber-600 bg-amber-50 border-amber-100'      },
    { label: 'Skipped',   count: counts.skip    || 0, icon: SkipForward, top: 'border-t-slate-400',   iconStyle: 'text-slate-600 bg-slate-100 border-slate-200'      },
  ]

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Audit Trail</h2>
          <p className="text-slate-600 text-sm mt-1">
            Every decision is logged — sources, scores, reviewer notes
          </p>
        </div>
        {auditLog.length === 0 && (
          <Button onClick={() => navigate('/review')}>
            Start Review <ArrowRight size={15} />
          </Button>
        )}
      </div>

      <SessionHistoryPanel
        sessions={sessionHistory}
        selectedId={selectedSessionId}
        onSelect={setSelectedSessionId}
      />

      {/* Summary cards */}
      {auditLog.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {summary.map(({ label, count, icon: Icon, top, iconStyle }) => (
            <div key={label} className={`bg-white border border-slate-200 border-t-4 ${top} rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${iconStyle}`}>
                  <Icon size={15} />
                </div>
                <div>
                  <p className="font-display text-3xl font-bold text-slate-900 leading-none">{count}</p>
                  <p className="text-xs text-slate-500 mt-1">{label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log */}
      {auditLog.length === 0 ? (
        <EmptyState
          icon={ScrollText}
          title="No decisions recorded yet"
          description="Complete the human review step to populate the audit trail."
          action={<Button onClick={() => navigate('/review')}>Go to Review <ArrowRight size={15} /></Button>}
        />
      ) : (
        <AuditLog log={auditLog} />
      )}

      {/* Feedback note */}
      {auditLog.length > 0 && (
        <div className="card-glass px-5 py-4 flex items-start gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500 mt-1.5 animate-pulse flex-shrink-0" />
          <p className="text-sm text-slate-600">
            <span className="text-slate-900 font-medium">Feedback loop active.</span>{' '}
            Your {auditLog.length} decision{auditLog.length !== 1 ? 's' : ''} have been queued for model retraining.
            The engine will improve on the next run.
          </p>
        </div>
      )}
    </div>
  )
}
