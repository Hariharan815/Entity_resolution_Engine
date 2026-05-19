import { useState } from 'react'
import { runResolve } from '../api/resolve'
import { postFeedback } from '../api/resolve'
import useStore from '../store/useStore'

export const useResolution = () => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const { uploadId, setResolving, setResults } = useStore()

  const resolve = async () => {
    setError(null)
    setLoading(true)
    setResolving(true)
    try {
      const res = await runResolve(uploadId)
      const payload = res?.data || {}
      const normalized = {
        goldenRecords: payload.goldenRecords || payload.golden_records || [],
        duplicateGroups: payload.duplicateGroups || payload.duplicate_groups || [],
        stats: payload.stats || null,
        reviewQueue: payload.reviewQueue || payload.review_queue || [],
      }

      if (!normalized.goldenRecords) {
        throw new Error('Resolution response is missing golden records')
      }
      setResults(normalized)
    } catch (e) {
      setError(e?.message || 'Resolution failed')
    } finally {
      setResolving(false)
      setLoading(false)
    }
  }

  return { resolve, error, loading }
}

export const useFeedback = () => {
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const { addFeedback, nextReview, uploadId } = useStore()

  const submit = async (groupId, decision, notes = '') => {
    setError(null)
    setSubmitting(true)
    try {
      await postFeedback({ upload_id: uploadId, group_id: groupId, decision, notes })
      addFeedback({ groupId, decision, notes, timestamp: new Date().toISOString() })
      nextReview()
    } catch (e) {
      setError(e?.message || 'Failed to submit feedback')
      throw e
    } finally {
      setSubmitting(false)
    }
  }

  return { submit, submitting, error }
}
