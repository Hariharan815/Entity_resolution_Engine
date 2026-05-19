import { useState } from 'react'
import { ChevronLeft, ChevronRight, Table2 } from 'lucide-react'

const PAGE_SIZE = 10

export default function PreviewTable({ data, headers }) {
  const [page, setPage] = useState(0)
  if (!data?.length) return null

  const total = data.length
  const start = page * PAGE_SIZE
  const rows = data.slice(start, start + PAGE_SIZE)
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Table2 size={18} className="text-indigo-600" />
          <span className="font-display font-semibold text-slate-900">Data Preview</span>
          <span className="badge-purple">{total.toLocaleString()} rows</span>
        </div>
        <span className="text-xs text-slate-500 font-mono">{headers?.length} columns</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              {headers.map(h => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={`border-b border-slate-200 table-row-hover ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}`}>
                {headers.map(h => (
                  <td key={h} className="px-5 py-3 text-slate-700 font-mono text-xs whitespace-nowrap max-w-[160px] overflow-hidden text-ellipsis">
                    {row[h] ?? <span className="text-slate-400 italic">-</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
        <span className="text-xs text-slate-500">
          Showing {start + 1}–{Math.min(start + PAGE_SIZE, total)} of {total}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(p => p - 1)}
            disabled={page === 0}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-300 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md disabled:opacity-40 transition-all duration-200"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="text-xs text-slate-500 font-mono min-w-[60px] text-center">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={page >= totalPages - 1}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-white border border-slate-300 text-slate-500 hover:bg-indigo-50 hover:text-indigo-700 hover:shadow-md disabled:opacity-40 transition-all duration-200"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
