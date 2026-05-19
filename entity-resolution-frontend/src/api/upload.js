import client from './client'

export const uploadCSV = (files, onProgress) => {
  const batch = Array.isArray(files) ? files : [files]
  const form = new FormData()
  batch.forEach((file) => form.append('files', file))
  return client.post('/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / e.total)),
  })
}
