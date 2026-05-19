import { useState } from 'react'
import { Check, X, Scissors, ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react'
import ConfidenceBadge from '../dashboard/ConfidenceBadge'
import ConflictHighlight from './ConflictHighlight'
import { Button } from '../common/Button'
import { useFeedback } from '../../hooks/useResolution'
import useStore from '../../store/useStore'

export default function ReviewCard() {
  const { reviewQueue, currentReviewIdx, prevReview } = useStore()
  const { submit, submitting } = useFeedback()
  const [notes, setNotes] = useState('')
  const [showNotes, setShowNotes] = useState(false)

  if (!reviewQueue?.length) return null

  const group = reviewQueue[currentReviewIdx]
  const total = reviewQueue.length
  const progress = ((currentReviewIdx) / total) * 100

  const handleDecision = async (decision) => {
    await submit(group.group_id, decision, notes)
    setNotes('')
    setShowNotes(false)
  }

  return (
    <div className="bg-white rounded-3xl shadow-md border border-slate-200 overflow-hidden">
      {/* Progress bar */}
      <div className="h-1.5 bg-slate-200 rounded-full">
        <div
          className="h-full bg-indigo-600 rounded-full transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-8 py-6 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-display font-bold text-slate-900">Review Merge Decision</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Case {currentReviewIdx + 1} of {total} · Group
            <span className="font-mono ml-1">#{group.group_id}</span>
          </p>
        </div>
        <ConfidenceBadge score={group.confidence} showLabel />
      </div>

      {/* Records side-by-side */}
      <div className="p-8">
        <p className="section-label mb-4">Candidate Records</p>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${group.records?.length || 2}, 1fr)` }}>
          {group.records?.map((rec, i) => {
            const keys = Object.keys(rec).filter(k => k !== 'source_id')
            return (
              <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all duration-200">
                <div className="pb-3 mb-3 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Record {i + 1}
                    {rec.source_id && (
                      <span className="ml-2 font-mono font-normal text-slate-400">#{rec.source_id}</span>
                    )}
                  </span>
                </div>
                <div className="space-y-2.5">
                  {keys.map(k => (
                    <div key={k}>
                      <p className="text-xs text-slate-500 mb-0.5">{k.replace(/_/g, ' ')}</p>
                      <p className="text-sm text-slate-700 font-mono">
                        {rec[k] || <span className="text-slate-400 italic text-xs">empty</span>}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Conflict highlights */}
        <ConflictHighlight records={group.records} />

        {/* Evidence section */}
        {group.evidence && (
          <div className="mt-5 p-4 bg-indigo-50 border border-indigo-100 rounded-2xl">
            <p className="section-label mb-3">Why the engine matched these</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(group.evidence).map(([field, score]) => (
                <div key={field} className="flex items-center justify-between px-3 py-2 bg-white rounded-full border border-indigo-100">
                  <span className="text-xs text-slate-600">{field.replace(/_/g, ' ')}</span>
                  <ConfidenceBadge score={score} />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {showNotes ? (
          <div className="mt-4">
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="Add a note about this decision (optional)…"
              rows={2}
              className="input text-sm resize-none"
            />
          </div>
        ) : (
          <button
            onClick={() => setShowNotes(true)}
            className="mt-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-indigo-700 transition-all duration-200"
          >
            <MessageSquare size={12} /> Add a note
          </button>
        )}
      </div>

      {/* Action buttons */}
      <div className="px-8 pb-8 flex flex-wrap items-center gap-3">
        <Button className="rounded-none px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white" onClick={() => handleDecision('approve')} loading={submitting}>
          <Check size={16} /> Approve Merge
        </Button>
        <Button className="rounded-none px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white" onClick={() => handleDecision('reject')} loading={submitting}>
          <X size={16} /> Reject Merge
        </Button>
        <Button className="rounded-none px-8 py-3 bg-amber-500 hover:bg-amber-600 text-white border border-amber-500" onClick={() => handleDecision('split')} loading={submitting}>
          <Scissors size={16} /> Split Records
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={prevReview} disabled={currentReviewIdx === 0}
            className="w-8 h-8 flex items-center justify-center rounded-none bg-white border border-slate-300 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md disabled:opacity-40 transition-all duration-200">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => submit(group.group_id, 'skip')}
            className="px-4 py-2 text-xs text-slate-500 hover:text-indigo-700 transition-all duration-200 rounded-none hover:bg-indigo-50">
            Skip →
          </button>
        </div>
      </div>
    </div>
  )
}
