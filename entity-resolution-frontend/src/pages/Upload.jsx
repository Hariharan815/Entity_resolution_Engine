import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import DropZone from '../components/upload/DropZone'
import PreviewTable from '../components/upload/PreviewTable'
import { Button } from '../components/common/Button'
import { useUpload } from '../hooks/useUpload'
import useStore from '../store/useStore'

export default function UploadPage() {
  const navigate = useNavigate()
  const { handleFile, progress, error, loading } = useUpload()
  const { rawData, headers, uploadId } = useStore()

  return (
    <div className="max-w-4xl mx-auto px-8 py-10">
      {/* Hero */}
      <div className="pt-16 pb-10 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-200 rounded-full mb-5">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
          <span className="text-xs font-semibold text-indigo-700">NEXORA-ERE</span>
        </div>
        <h1 className="font-display text-4xl md:text-5xl font-bold text-slate-900 leading-tight mb-3">
          Entity Resolution<br />
          <span className="text-indigo-600">Engine</span>
        </h1>
        <p className="text-slate-600 text-lg max-w-2xl">
          Upload a messy dataset — customer records, product listings, suppliers.
          The engine finds duplicates, resolves conflicts, and produces clean golden records.
        </p>
      </div>

      {/* Drop zone */}
      <DropZone onFile={handleFile} loading={loading} error={error} progress={progress} rowCount={rawData.length} />

      {/* Preview + CTA */}
      {rawData.length > 0 && (
        <div className="mt-8 space-y-6">
          <PreviewTable data={rawData} headers={headers} />

          <div className="flex items-center justify-between p-5 card">
            <div>
              <p className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Upload successful
              </p>
              <p className="text-sm text-slate-700 mt-1">
                {rawData.length.toLocaleString()} rows loaded · {headers?.length} columns
              </p>
              <p className="text-xs text-slate-500 mt-0.5">Ready to run entity resolution</p>
            </div>
            <Button
              onClick={() => navigate('/results')}
              disabled={!uploadId || loading}
            >
              {loading ? 'Processing…' : 'Run Entity Resolution'} <ArrowRight size={16} />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
