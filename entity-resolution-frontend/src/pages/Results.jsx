import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Play, Download, GitMerge, FileSpreadsheet, Loader2 } from 'lucide-react'
import StatsBar from '../components/dashboard/StatsBar'
import GoldenTable from '../components/dashboard/GoldenTable'
import DuplicateGroup from '../components/review/DuplicateGroup'
import { Button } from '../components/common/Button'
import { useResolution } from '../hooks/useResolution'
import { exportData } from '../api/resolve'
import { downloadBlob } from '../utils/formatters'
import useStore from '../store/useStore'

const tabs = ['Golden Records', 'Duplicate Groups']

export default function ResultsPage() {
  const navigate = useNavigate()
  const { resolve, error } = useResolution()
  const { goldenRecords, duplicateGroups, stats, isResolving, uploadId, reviewQueue } = useStore()
  const [tab, setTab] = useState(0)
  const [exporting, setExporting] = useState(false)
  const [stageIdx, setStageIdx] = useState(0)

  const pipelineStages = [
    'Blocking candidates...',
    'Scoring similarity...',
    'Running ML classifier...',
    'Resolving conflicts...',
    'Building golden records...',
  ]

  useEffect(() => {
    if (uploadId && !goldenRecords.length && !isResolving) {
      const timer = setTimeout(() => {
        resolve()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [uploadId, goldenRecords.length, isResolving, resolve])

  useEffect(() => {
    if (!isResolving) {
      setStageIdx(0)
      return
    }

    const interval = setInterval(() => {
      setStageIdx((prev) => (prev + 1) % pipelineStages.length)
    }, 400)

    return () => clearInterval(interval)
  }, [isResolving, pipelineStages.length])

  const handleExport = async (format) => {
    setExporting(true)
    try {
      const res = await exportData(uploadId, format)
      downloadBlob(res.data, `golden_records.${format}`)
    } catch {
      // Error surface is handled by the API hook/store state.
    } finally {
      setExporting(false)
    }
  }

  const handleRunResolution = async () => {
    if (!uploadId) return
    await resolve()
  }

  if (isResolving) return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="card p-16 flex flex-col items-center gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
            <Loader2 size={32} className="text-indigo-600 animate-spin" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="font-display text-xl font-bold text-slate-900 mb-2">Running Entity Resolution</h3>
          <p className="text-slate-600 text-sm max-w-xs">
            {pipelineStages[stageIdx]}
          </p>
        </div>
        <div className="flex gap-2 text-xs text-slate-500">
          {pipelineStages.map((s, i) => (
            <span
              key={s}
              className={`px-2.5 py-1 border rounded-full transition-all duration-200 ${
                i === stageIdx
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-white border-slate-300'
              }`}
            >
              {s.replace('...', '')}
            </span>
          ))}
        </div>
      </div>
    </div>
  )

  if (!goldenRecords.length) return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <div className="card p-16 text-center">
        <h3 className="font-display text-xl font-bold text-slate-900 mb-3">Run Entity Resolution</h3>
        <p className="text-slate-600 text-sm mb-6">
          {uploadId
            ? 'Dataset is ready. Click below to run backend resolution and generate golden records.'
            : 'Upload a CSV first, then run the engine.'}
        </p>
        {uploadId ? (
          <Button onClick={handleRunResolution}>
            <Play size={15} /> Run Entity Resolution
          </Button>
        ) : (
          <Button onClick={() => navigate('/upload')}>Go to Upload</Button>
        )}
      </div>
    </div>
  )

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-slate-900">Resolution Results</h2>
          <p className="text-slate-600 text-sm mt-1">Engine completed · review the golden records below</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" onClick={() => handleExport('csv')} loading={exporting}>
            <Download size={15} /> Download CSV
          </Button>
          <Button variant="secondary" onClick={() => handleExport('xlsx')} loading={exporting}>
            <FileSpreadsheet size={15} /> Download Excel
          </Button>
          {reviewQueue?.length > 0 && (
            <Button onClick={() => navigate('/review')}>
              <GitMerge size={15} /> Review ({reviewQueue.length})
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <StatsBar stats={stats} />

      {/* Error */}
      {error && (
        <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-sm">
          {error}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-full w-fit shadow-sm">
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(i)}
            className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
              tab === i ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
            }`}>
            {t}
            {i === 1 && duplicateGroups.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-indigo-100 text-indigo-700 rounded-full">
                {duplicateGroups.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === 0 && <GoldenTable records={goldenRecords} />}
      {tab === 1 && (
        <div className="space-y-3">
          {duplicateGroups.map((g, i) => <DuplicateGroup key={g.group_id} group={g} index={i} />)}
        </div>
      )}
    </div>
  )
}
