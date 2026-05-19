import { useState } from 'react'
import { uploadCSV } from '../api/upload'
import { parseCSV } from '../utils/csvParser'
import useStore from '../store/useStore'

export const useUpload = () => {
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { setUpload, setUploadId, setTotalRows } = useStore()

  const handleFile = async (incoming) => {
    setError(null)
    setProgress(0)
    setLoading(true)
    try {
      const files = Array.isArray(incoming) ? incoming : [incoming]
      const validFiles = files.filter((file) => file && file.name?.toLowerCase().endsWith('.csv'))
      if (!validFiles.length) {
        throw new Error('Please select at least one CSV file')
      }

      const parsed = await Promise.all(validFiles.map((file) => parseCSV(file)))
      const allHeaders = Array.from(new Set(parsed.flatMap((item) => item.headers || [])))
      const headers = ['source', ...allHeaders]

      const mergedRows = []
      parsed.forEach((item, idx) => {
        const source = validFiles[idx].name
        item.data.forEach((row) => {
          const normalized = { source }
          allHeaders.forEach((h) => {
            normalized[h] = row[h] ?? ''
          })
          mergedRows.push(normalized)
        })
      })

      setUpload(validFiles, mergedRows, headers)
      const res = await uploadCSV(validFiles, setProgress)
      setUploadId(res.data.upload_id)
      setTotalRows(Number(res?.data?.total_rows) || mergedRows.length)
    } catch (e) {
      setError(e?.message || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return { handleFile, progress, error, loading }
}
