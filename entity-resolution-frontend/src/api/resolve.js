import client from './client'

export const runResolve = (uploadId) =>
  client.post('/resolve', { upload_id: uploadId })

export const getResults = (uploadId) =>
  client.get('/results', { params: { upload_id: uploadId } })

export const postFeedback = (payload) =>
  client.post('/feedback', payload)

export const exportData = (uploadId, format = 'csv') =>
  client.get('/export', {
    params: { upload_id: uploadId, format },
    responseType: 'blob',
  })

export const getAudit = (uploadId) =>
  client.get('/audit', { params: { upload_id: uploadId } })

export const getStats = (uploadId) =>
  client.get('/stats', { params: { upload_id: uploadId } })
