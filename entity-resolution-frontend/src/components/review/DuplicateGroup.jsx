import { Users, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import ConfidenceBadge from '../dashboard/ConfidenceBadge'

export default function DuplicateGroup({ group, index }) {
  const [expanded, setExpanded] = useState(index === 0)
  const { records = [], confidence, group_id } = group
  const keys = records[0] ? Object.keys(records[0]).filter(k => !['source_id', 'source'].includes(k)) : []

  return (
    <div className="card overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-5 py-4 flex items-center justify-between hover:bg-indigo-50 transition-all duration-200"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center">
            <Users size={14} className="text-indigo-600" />
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-900">
              Group {index + 1}
              <span className="text-slate-500 font-normal font-mono ml-2 text-xs">#{group_id}</span>
            </p>
            <p className="text-xs text-slate-500">{records.length} matching records</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ConfidenceBadge score={confidence} showLabel />
          {expanded ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-200 overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-5 py-3 text-left text-slate-500 uppercase tracking-wider font-semibold">#</th>
                <th className="px-5 py-3 text-left text-slate-500 uppercase tracking-wider font-semibold">Source</th>
                {keys.map(k => (
                  <th key={k} className="px-5 py-3 text-left text-slate-500 uppercase tracking-wider font-semibold whitespace-nowrap">
                    {k.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.map((rec, i) => (
                <tr key={i} className={`border-b border-slate-200 table-row-hover ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                  <td className="px-5 py-3 text-slate-500 font-mono">{i + 1}</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono">
                      {rec.source || 'unknown'}
                    </span>
                  </td>
                  {keys.map(k => (
                    <td key={k} className="px-5 py-3 font-mono text-slate-700 whitespace-nowrap max-w-[160px] overflow-hidden text-ellipsis">
                      {rec[k] ?? <span className="text-slate-400 italic">-</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
