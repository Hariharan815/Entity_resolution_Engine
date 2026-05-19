import { Check, X, Scissors, SkipForward, ScrollText } from 'lucide-react'
import { fmtDate } from '../../utils/formatters'
import { EmptyState } from '../common/Button'

const icons = {
  approve: { icon: Check,       cls: 'text-emerald-600 bg-emerald-50 border-emerald-100', rail: 'border-l-emerald-500' },
  reject:  { icon: X,           cls: 'text-rose-600 bg-rose-50 border-rose-100',           rail: 'border-l-rose-500'    },
  split:   { icon: Scissors,    cls: 'text-amber-600 bg-amber-50 border-amber-100',        rail: 'border-l-amber-500'   },
  skip:    { icon: SkipForward, cls: 'text-slate-600 bg-slate-100 border-slate-200',       rail: 'border-l-slate-400'   },
}

const labels = {
  approve: 'Merge approved',
  reject:  'Merge rejected',
  split:   'Records split',
  skip:    'Review skipped',
}

export default function AuditLog({ log = [] }) {
  if (!log.length) return (
    <EmptyState
      icon={ScrollText}
      title="No decisions yet"
      description="Reviewer decisions will appear here as you work through the review queue."
    />
  )

  return (
    <div className="space-y-3">
      {log.map((entry, i) => {
        const { icon: Icon, cls, rail } = icons[entry.decision] || icons.skip
        return (
          <div key={i} className={`bg-white border border-slate-200 border-l-4 ${rail} rounded-2xl shadow-sm hover:shadow-md px-5 py-4 flex items-start gap-4 transition-all duration-200`}>
            <div className={`w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 ${cls}`}>
              <Icon size={15} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-semibold text-slate-900">{labels[entry.decision]}</span>
                <span className="font-mono text-xs text-slate-500">#{entry.groupId}</span>
              </div>
              {entry.notes && (
                <p className="text-xs text-slate-500 mt-1 italic">"{entry.notes}"</p>
              )}
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap font-mono text-right">{fmtDate(entry.timestamp)}</span>
          </div>
        )
      })}
    </div>
  )
}
