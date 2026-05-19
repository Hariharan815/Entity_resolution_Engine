import { useNavigate } from 'react-router-dom'
import { GitMerge, CheckCircle2, ArrowRight } from 'lucide-react'
import ReviewCard from '../components/review/ReviewCard'
import { Button } from '../components/common/Button'
import { EmptyState } from '../components/common/Button'
import useStore from '../store/useStore'

export default function ReviewPage() {
  const navigate = useNavigate()
  const { reviewQueue, currentReviewIdx, auditLog } = useStore()
  const done = currentReviewIdx >= reviewQueue.length

  if (!reviewQueue.length) return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <EmptyState
        icon={GitMerge}
        title="No review queue"
        description="Run entity resolution first. Low-confidence matches will appear here for human review."
        action={<Button onClick={() => navigate('/results')}>View Results <ArrowRight size={15} /></Button>}
      />
    </div>
  )

  if (done) return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="card p-16 flex flex-col items-center gap-5 text-center">
        <div className="w-20 h-20 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center">
          <CheckCircle2 size={36} className="text-emerald-600" />
        </div>
        <div>
          <h3 className="font-display text-2xl font-bold text-slate-900 mb-2">Review Complete</h3>
          <p className="text-slate-600 text-sm max-w-xs">
            You reviewed {auditLog.length} decisions. The model will learn from your corrections.
          </p>
        </div>
        <div className="flex gap-3 mt-2">
          <Button variant="secondary" onClick={() => navigate('/results')}>
            Back to Results
          </Button>
          <Button onClick={() => navigate('/audit')}>
            View Audit Log <ArrowRight size={15} />
          </Button>
        </div>
      </div>
    </div>
  )

  const remaining = reviewQueue.length - currentReviewIdx

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold text-slate-900">Human Review</h2>
            <p className="text-slate-600 text-sm mt-1">
              {remaining} case{remaining !== 1 ? 's' : ''} remaining · your decisions improve the model
            </p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/results')}>
            ← Back to results
          </Button>
        </div>
      </div>

      {/* Review card */}
      <ReviewCard />

      {/* Mini audit preview */}
      {auditLog.length > 0 && (
        <div className="card-glass px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <p className="section-label">Recent decisions</p>
            <button onClick={() => navigate('/audit')} className="text-xs text-indigo-600 hover:underline">
              View all →
            </button>
          </div>
          <div className="space-y-2">
            {auditLog.slice(0, 3).map((entry, i) => (
              <div key={i} className="flex items-center gap-3 text-xs">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  entry.decision === 'approve' ? 'bg-emerald-500' :
                  entry.decision === 'reject'  ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
                <span className="text-slate-500 font-mono">#{entry.groupId}</span>
                <span className="text-slate-600 capitalize">{entry.decision}</span>
                {entry.notes && <span className="text-slate-400 italic truncate">"{entry.notes}"</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
