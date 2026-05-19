import { useCallback, useState } from 'react'
import { UploadCloud, FileText, AlertCircle, CheckCircle2 } from 'lucide-react'
import clsx from 'clsx'

export default function DropZone({ onFile, loading, error, progress, rowCount = 0 }) {
  const [dragging, setDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])

  const handle = useCallback((incoming) => {
    const files = Array.from(incoming || []).filter((file) => file?.name?.toLowerCase().endsWith('.csv'))
    if (!files.length) return
    setSelectedFiles(files)
    onFile(files)
  }, [onFile])

  const onDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    handle(e.dataTransfer.files)
  }

  const onDragOver = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = () => setDragging(false)
  const onChange = (e) => handle(e.target.files)

  const removeFile = (name) => {
    const next = selectedFiles.filter((file) => file.name !== name)
    setSelectedFiles(next)
    if (next.length) onFile(next)
  }

  const selectedLabel = selectedFiles.length === 1
    ? selectedFiles[0].name
    : `${selectedFiles.length} files selected`

  return (
    <div className="w-full">
      <label
        htmlFor="csv-input"
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={clsx(
          'relative flex flex-col items-center justify-center gap-5 p-16 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 group bg-white shadow-sm hover:shadow-md',
          dragging  ? 'border-indigo-500 bg-indigo-50 scale-[1.01]' : 'border-indigo-300 hover:border-indigo-400 hover:bg-indigo-50',
          loading   && 'pointer-events-none opacity-70',
        )}
      >
        {/* Animated bg blob */}
        <div className={clsx(
          'absolute inset-0 rounded-2xl transition-opacity duration-500',
          'bg-[radial-gradient(ellipse_60%_60%_at_50%_50%,rgba(108,99,255,0.08),transparent)]',
          dragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        )} />

        {loading ? (
          <div className="flex flex-col items-center gap-4 z-10">
            <div className="w-16 h-16 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center">
              <UploadCloud size={26} className="text-indigo-600 animate-bounce" />
            </div>
            <div className="w-56 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-slate-600 text-sm">Uploading... {progress}%</p>
          </div>
        ) : selectedFiles.length ? (
          <div className="flex flex-col items-center gap-3 z-10">
            <div className="w-14 h-14 rounded-full bg-indigo-600 border border-indigo-600 flex items-center justify-center shadow-sm">
              <CheckCircle2 size={24} className="text-white" />
            </div>
            <p className="font-semibold text-slate-900 text-sm">{selectedLabel}</p>
            <p className="text-slate-500 text-xs">Files loaded - scroll down to preview</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 z-10">
            <div className="w-20 h-20 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center transition-colors">
              <UploadCloud size={34} className="text-indigo-600" />
            </div>
            <div className="text-center">
              <p className="font-display font-semibold text-slate-900 text-lg">
                Drop your CSV files here
              </p>
              <p className="text-slate-600 text-sm mt-1">
                or <span className="text-indigo-600 underline underline-offset-2">browse files</span>
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-200">
              <FileText size={14} className="text-slate-500" />
              <span className="text-xs text-slate-500 font-mono">CSV files only · max 50MB</span>
            </div>
          </div>
        )}
      </label>

      <input id="csv-input" type="file" accept=".csv" multiple className="hidden" onChange={onChange} />

      {selectedFiles.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedFiles.map((file) => (
            <span key={file.name} className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-xs text-indigo-700">
              {file.name}
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  removeFile(file.name)
                }}
                className="text-indigo-600 hover:text-indigo-800"
                aria-label={`Remove ${file.name}`}
              >
                x
              </button>
            </span>
          ))}
        </div>
      )}

      {rowCount > 0 && (
        <p className="mt-2 text-xs text-emerald-700 font-semibold">
          Total combined rows parsed: {rowCount.toLocaleString()}
        </p>
      )}

      {error && (
        <div className="mt-3 flex items-center gap-2 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl">
          <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
          <p className="text-rose-700 text-sm">{error}</p>
        </div>
      )}
    </div>
  )
}
