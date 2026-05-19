import { TrendingDown, Layers, CheckCircle2, Target, Database } from 'lucide-react'
import { fmtNum } from '../../utils/formatters'
import useStore from '../../store/useStore'

const Stat = ({ icon: Icon, label, value, sub, color = 'brand' }) => {
  const colors = {
    brand:   { top: 'border-t-indigo-500', icon: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
    emerald: { top: 'border-t-emerald-500', icon: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
    amber:   { top: 'border-t-amber-500', icon: 'text-amber-600 bg-amber-50 border-amber-100' },
    rose:    { top: 'border-t-rose-500', icon: 'text-rose-600 bg-rose-50 border-rose-100' },
  }
  return (
    <div className={`bg-white border border-slate-200 border-t-4 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200 ${colors[color].top}`}>
      <div className="flex items-start gap-4">
        <div className={`w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 ${colors[color].icon}`}>
        <Icon size={20} />
        </div>
        <div>
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{label}</p>
          <p className="text-4xl font-bold text-slate-900 leading-none">{value}</p>
          {sub && <p className="text-xs text-slate-500 mt-2">{sub}</p>}
        </div>
      </div>
    </div>
  )
}

export default function StatsBar({ stats }) {
  const { uploadedFiles } = useStore()
  if (!stats) return null
  const { original, golden, duplicates_found, accuracy, sources = [] } = stats
  const reduction = original ? Math.round(((original - golden) / original) * 100) : 0
  const accuracyValue = typeof accuracy === 'number' ? `${(accuracy * 100).toFixed(1)}%` : '0.0%'
  const sourceList = Array.isArray(sources) ? sources : []
  const sourceCount = sourceList.length || stats.file_count || uploadedFiles?.length || 1
  const displaySources = sourceList.length ? sourceList : (uploadedFiles || []).map((f) => f?.name).filter(Boolean)

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <Stat icon={Layers}      label="Original Records"  value={fmtNum(original)}        sub="rows in uploaded CSV"             color="brand"   />
      <Stat icon={CheckCircle2} label="Golden Records"   value={fmtNum(golden)}          sub={`${reduction}% reduction`}        color="emerald" />
      <Stat icon={TrendingDown} label="Duplicates Found" value={fmtNum(duplicates_found)} sub="merged into golden records"       color="amber"   />
      <Stat icon={Target}       label="Accuracy"         value={accuracyValue}            color="rose" />
      <div className="bg-white border border-slate-200 border-t-4 border-t-sky-500 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-200">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 text-sky-600 bg-sky-50 border-sky-100">
            <Database size={20} />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Data Sources</p>
            <p className="text-4xl font-bold text-slate-900 leading-none">{sourceCount}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {displaySources.map((name) => (
                <span key={name} className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded border border-indigo-100 truncate max-w-[80px]">
                  {name}
                </span>
              ))}
              {!displaySources.length && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-indigo-50 text-indigo-500 rounded border border-indigo-100">
                  1 dataset
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
