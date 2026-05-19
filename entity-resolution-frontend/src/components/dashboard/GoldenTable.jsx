import { useState } from 'react'
import { Search, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react'
import ConfidenceBadge from './ConfidenceBadge'

const PAGE_SIZE = 15

const SOURCE_COLORS = [
  'bg-indigo-50 text-indigo-700 border-indigo-200',
  'bg-teal-50 text-teal-700 border-teal-200',
  'bg-amber-50 text-amber-700 border-amber-200',
  'bg-rose-50 text-rose-700 border-rose-200',
]

const sourceColorClass = (name) => {
  const text = String(name || '')
  let hash = 0
  for (let i = 0; i < text.length; i += 1) {
    hash = ((hash << 5) - hash) + text.charCodeAt(i)
    hash |= 0
  }
  return SOURCE_COLORS[Math.abs(hash) % SOURCE_COLORS.length]
}

export default function GoldenTable({ records }) {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [sortField, setSortField] = useState('confidence')
  const [sortDir, setSortDir] = useState('desc')

  if (!records?.length) return null

  const keys = Object.keys(records[0]).filter(k => !['source_ids', 'lineage', 'source_files'].includes(k))

  const filtered = records
    .filter(r => keys.some(k => String(r[k] ?? '').toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => {
      const av = a[sortField] ?? ''
      const bv = b[sortField] ?? ''
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1)
    })

  const total = filtered.length
  const start = page * PAGE_SIZE
  const rows = filtered.slice(start, start + PAGE_SIZE)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  const toggleSort = (field) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-slate-200">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200 flex flex-wrap items-center gap-4">
        <div>
          <h3 className="font-display font-semibold text-slate-900">Golden Records</h3>
          <p className="text-xs text-slate-500 mt-0.5">{total} clean, deduplicated records</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0) }}
              placeholder="Search records…"
              className="w-56 rounded-full border border-slate-300 bg-white pl-9 pr-4 py-2 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition-all duration-200"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              {keys.map(k => (
                <th key={k} className="px-5 py-3 text-left">
                  <button
                    onClick={() => toggleSort(k)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider hover:text-indigo-700 transition-all duration-200"
                  >
                    {k.replace(/_/g, ' ')}
                    <ArrowUpDown size={10} className="opacity-50" />
                  </button>
                </th>
              ))}
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Sources
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={`border-b border-slate-200 table-row-hover ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                {keys.map(k => (
                  <td key={k} className="px-5 py-3 text-slate-700 text-xs font-mono whitespace-nowrap max-w-[180px] overflow-hidden text-ellipsis">
                    {row[k] ?? <span className="text-slate-400 italic">-</span>}
                  </td>
                ))}
                <td className="px-5 py-3">
                  <ConfidenceBadge score={row.confidence ?? 1} />
                </td>
                <td className="px-5 py-3">
                  {(() => {
                    const sources = typeof row.source_files === 'string'
                      ? row.source_files.split(',').map((s) => s.trim())
                      : (row.source_files || [])
                    const normalized = sources.filter(Boolean)

                    return (
                  <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                    {normalized.map((source) => (
                        <span key={`${i}-${source}`} className={`text-[10px] px-1.5 py-0.5 rounded-full border font-mono ${sourceColorClass(source)}`}>
                          {source}
                        </span>
                      ))}
                    {!normalized.length && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full border font-mono bg-slate-100 text-slate-500 border-slate-200">
                        unknown
                      </span>
                    )}
                  </div>
                    )
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          {start + 1}–{Math.min(start + PAGE_SIZE, total)} of {total} records
        </span>
        <div className="flex items-center gap-2">
          <button onClick={() => setPage(p => p - 1)} disabled={page === 0}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-300 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md disabled:opacity-40 transition-all duration-200">
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs font-mono text-slate-500 w-16 text-center">{page + 1} / {totalPages}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages - 1}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-300 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md disabled:opacity-40 transition-all duration-200">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
