import { AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function ConflictHighlight({ records }) {
  if (!records?.length) return null
  const keys = Object.keys(records[0]).filter(k => k !== 'source_id')

  const isConflict = (field) => {
    const values = records.map(r => String(r[field] ?? '').trim().toLowerCase()).filter(Boolean)
    return new Set(values).size > 1
  }

  const conflicts = keys.filter(isConflict)
  const matches   = keys.filter(k => !isConflict(k))

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
      {/* Conflicts */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-amber-500/15 flex items-center gap-2">
            <AlertTriangle size={14} className="text-amber-600" />
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Conflicting Fields ({conflicts.length})
            </span>
          </div>
          <div className="p-4 space-y-3">
            {conflicts.map(field => (
              <div key={field}>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">{field.replace(/_/g, ' ')}</p>
                <div className="flex flex-wrap gap-2">
                  {records.map((rec, i) => (
                    <span key={i} className="px-2.5 py-1 bg-white border border-amber-200 rounded-full text-xs font-mono text-amber-700">
                      {rec[field] || <span className="text-slate-400 italic">empty</span>}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Matches */}
      {matches.length > 0 && (
        <div className="bg-indigo-50 border border-indigo-200 rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-emerald-500/15 flex items-center gap-2">
            <CheckCircle2 size={14} className="text-indigo-600" />
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">
              Matching Fields ({matches.length})
            </span>
          </div>
          <div className="p-4 space-y-3">
            {matches.map(field => (
              <div key={field}>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1.5">{field.replace(/_/g, ' ')}</p>
                <span className="px-2.5 py-1 bg-white border border-indigo-200 rounded-full text-xs font-mono text-indigo-700">
                  {records[0][field] || <span className="text-slate-400 italic">empty</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
