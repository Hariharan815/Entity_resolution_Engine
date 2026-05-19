import { scoreColor, scoreLabel, fmtScore } from '../../utils/formatters'
import clsx from 'clsx'

export default function ConfidenceBadge({ score, showLabel = false }) {
  const variant = scoreColor(score)
  return (
    <span className={clsx('badge font-mono', variant)}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {fmtScore(score)}
      {showLabel && <span className="ml-1 font-sans font-normal opacity-80">· {scoreLabel(score)}</span>}
    </span>
  )
}
