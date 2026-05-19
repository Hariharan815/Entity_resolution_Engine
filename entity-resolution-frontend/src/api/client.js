import Papa from 'papaparse'

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const randomDelay = (min = 200, max = 1200) =>
  Math.floor(Math.random() * (max - min + 1)) + min

const uploadRegistry = {}
const resultRegistry = {}
const auditRegistry = {}
let lastResult = null

const lower = (value) => String(value || '').trim().toLowerCase()
const digits = (value) => String(value || '').replace(/\D+/g, '')

const pickField = (row, candidates) => {
  const keys = Object.keys(row || {})
  const match = keys.find((key) => candidates.some((c) => lower(key).includes(c)))
  return match ? row[match] : ''
}

const parseCsvFile = (file) =>
  new Promise((resolve) => {
    if (!file) {
      resolve({ rowCount: 0, rows: [] })
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      Papa.parse(reader.result, {
        header: true,
        skipEmptyLines: true,
        complete: ({ data }) => {
          const rows = Array.isArray(data) ? data : []
          resolve({ rowCount: rows.length, rows })
        },
        error: () => resolve({ rowCount: 0, rows: [] }),
      })
    }
    reader.onerror = () => resolve({ rowCount: 0, rows: [] })
    reader.readAsText(file)
  })

const normalizeRow = (row, source, index) => {
  const name = pickField(row, ['name', 'customer', 'person'])
  const email = pickField(row, ['email', 'mail'])
  const phone = pickField(row, ['phone', 'mobile', 'contact'])
  const address = pickField(row, ['address', 'addr', 'street'])
  const city = pickField(row, ['city', 'town'])
  const company = pickField(row, ['company', 'organization', 'org', 'business'])

  return {
    source,
    source_id: `U-${String(index + 1).padStart(4, '0')}`,
    name: String(name || '').trim(),
    email: String(email || '').trim(),
    phone: String(phone || '').trim(),
    address: String(address || '').trim(),
    city: String(city || '').trim(),
    company: String(company || '').trim(),
    raw: row,
  }
}

const matchKey = (row) => {
  const emailKey = lower(row.email)
  const phoneKey = digits(row.phone)
  const nameKey = lower(row.name)
  const cityKey = lower(row.city)

  if (emailKey) return `e:${emailKey}`
  if (phoneKey.length >= 7) return `p:${phoneKey}`
  if (nameKey) return `n:${nameKey}|${cityKey}`
  return `r:${lower(JSON.stringify(row.raw || {}))}`
}

const chooseRepresentative = (rows) => {
  const score = (r) =>
    [r.name, r.email, r.phone, r.address, r.city, r.company].filter((v) => String(v || '').trim()).length
  return rows.slice().sort((a, b) => score(b) - score(a))[0] || rows[0]
}

const buildEvidence = (rows) => {
  const first = rows[0] || {}
  const allSamePhone = rows.every((r) => digits(r.phone) && digits(r.phone) === digits(first.phone))
  const allSameEmailDomain = rows.every((r) => {
    const domain = lower(r.email).split('@')[1] || ''
    const firstDomain = lower(first.email).split('@')[1] || ''
    return domain && firstDomain && domain === firstDomain
  })
  const nameSimilarity = rows.length > 1 ? 0.86 : 0.72
  const addressSimilarity = rows.length > 1 ? 0.74 : 0.63

  return {
    name_similarity: Number(nameSimilarity.toFixed(2)),
    phone_match: allSamePhone ? 1.0 : 0.6,
    address_similarity: Number(addressSimilarity.toFixed(2)),
    email_domain_match: allSameEmailDomain ? 1.0 : 0.5,
  }
}

const buildResolveResult = (uploadId) => {
  const uploadMeta = uploadRegistry[uploadId] || { files: [], rows: [] }
  const files = Array.isArray(uploadMeta.files) ? uploadMeta.files : []
  const sources = files.map((f) => f.name).filter(Boolean)
  const rows = Array.isArray(uploadMeta.rows) ? uploadMeta.rows : []
  const original = rows.length

  const buckets = new Map()
  rows.forEach((row, idx) => {
    const key = matchKey(row)
    const next = buckets.get(key) || []
    next.push({ ...row, row_index: idx })
    buckets.set(key, next)
  })

  const grouped = Array.from(buckets.values())

  const goldenRecords = grouped.map((group, idx) => {
    const representative = chooseRepresentative(group)
    const sourceFiles = Array.from(new Set(group.map((r) => r.source).filter(Boolean)))
    const confidence = Number((0.78 + Math.min(0.2, (group.length - 1) * 0.06)).toFixed(2))

    return {
      name: representative.name || `Entity ${idx + 1}`,
      email: representative.email || '',
      phone: representative.phone || '',
      address: representative.address || '',
      city: representative.city || '',
      company: representative.company || '',
      confidence,
      record_id: `GR-${String(idx + 1).padStart(4, '0')}`,
      source_files: sourceFiles,
    }
  })

  const duplicateGroups = grouped
    .filter((group) => group.length > 1)
    .slice(0, 12)
    .map((group, idx) => {
      const confidence = Number((0.84 - Math.min(idx, 6) * 0.04).toFixed(2))
      return {
        group_id: `DG-${String(201 + idx)}`,
        confidence,
        records: group.map((record) => ({
          source_id: record.source_id,
          source_file: record.source,
          name: record.name,
          email: record.email,
          phone: record.phone,
          address: record.address,
          city: record.city,
          company: record.company,
          row_index: record.row_index,
        })),
        evidence: buildEvidence(group),
        status: 'pending',
      }
    })

  const reviewQueue = duplicateGroups.filter(
    (group) => group.confidence >= 0.5 && group.confidence <= 0.84
  )

  const golden = goldenRecords.length
  const stats = {
    original,
    golden,
    duplicates_found: Math.max(0, original - golden),
    accuracy: 0.92,
    pending_review: reviewQueue.length,
    sources,
    file_count: sources.length,
  }

  return {
    upload_id: uploadId,
    goldenRecords,
    duplicateGroups,
    stats,
    reviewQueue,
  }
}

const toCsvBlob = (rows) => {
  if (!rows?.length) return new Blob([''], { type: 'text/csv' })

  const headers = Object.keys(rows[0])
  const escapeCsv = (value) => {
    const text = String(value ?? '')
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`
    return text
  }

  const csv = [
    headers.join(','),
    ...rows.map((row) => headers.map((key) => escapeCsv(row[key])).join(',')),
  ].join('\n')

  return new Blob([csv], { type: 'text/csv' })
}

const toPath = (url) => {
  if (!url) return '/'
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      return new URL(url).pathname
    } catch {
      return url
    }
  }
  return url.split('?')[0]
}

const client = {
  post: async (url, payload, config = {}) => {
    const path = toPath(url)

    if (path === '/upload') {
      const files = payload?.getAll?.('files') || []
      const filenames = files.map((file) => file?.name || 'mock_upload.csv')
      const onProgress = config?.onUploadProgress

      if (typeof onProgress === 'function') {
        onProgress({ loaded: 25, total: 100 })
        await wait(160)
        onProgress({ loaded: 65, total: 100 })
        await wait(160)
        onProgress({ loaded: 100, total: 100 })
      }

      await wait(randomDelay())

      const parsedFiles = await Promise.all(files.map((file) => parseCsvFile(file)))
      const filesMeta = parsedFiles.map((parsed, idx) => ({
        name: files[idx]?.name || `dataset_${idx + 1}.csv`,
        rowCount: parsed.rowCount,
      }))

      const mergedRows = []
      parsedFiles.forEach((parsed, fileIdx) => {
        const source = filesMeta[fileIdx].name
        parsed.rows.forEach((row, rowIdx) => {
          mergedRows.push(normalizeRow(row, source, mergedRows.length + rowIdx))
        })
      })

      const uploadId = `mock_${Date.now()}`
      const totalRows = filesMeta.reduce((sum, file) => sum + file.rowCount, 0)

      uploadRegistry[uploadId] = {
        upload_id: uploadId,
        files: filesMeta,
        rows: mergedRows,
      }

      auditRegistry[uploadId] = [
        {
          type: 'upload',
          at: new Date().toISOString(),
          description: `Uploaded ${filesMeta.length} dataset(s)`,
          metadata: { filenames, total_rows: totalRows },
        },
      ]

      return {
        data: {
          upload_id: uploadId,
          file_count: filesMeta.length,
          filenames,
          total_rows: totalRows,
        },
      }
    }

    if (path === '/resolve') {
      await wait(1500)
      const uploadId = payload?.upload_id || Object.keys(uploadRegistry).at(-1) || `mock_${Date.now()}`
      const result = buildResolveResult(uploadId)

      resultRegistry[uploadId] = result
      lastResult = result

      const entries = auditRegistry[uploadId] || []
      entries.push({
        type: 'resolve',
        at: new Date().toISOString(),
        description: 'Entity resolution completed',
        metadata: {
          original: result.stats.original,
          golden: result.stats.golden,
          duplicates_found: result.stats.duplicates_found,
        },
      })
      auditRegistry[uploadId] = entries

      return { data: result }
    }

    if (path === '/feedback') {
      await wait(300)

      const uploadId = payload?.upload_id
      const groupId = payload?.group_id
      const decision = payload?.decision

      const result = resultRegistry[uploadId]
      if (result && groupId) {
        result.duplicateGroups = (result.duplicateGroups || []).map((group) =>
          group.group_id === groupId ? { ...group, status: decision || 'pending' } : group
        )
        result.reviewQueue = (result.reviewQueue || []).filter((group) => group.group_id !== groupId)
        result.stats = {
          ...(result.stats || {}),
          pending_review: result.reviewQueue.length,
        }
        lastResult = result
      }

      const entries = auditRegistry[uploadId] || []
      entries.push({
        type: 'feedback',
        at: new Date().toISOString(),
        description: `Feedback submitted for ${groupId}`,
        metadata: { group_id: groupId, decision },
      })
      auditRegistry[uploadId] = entries

      return {
        data: {
          success: true,
          group_id: groupId,
          decision,
          message: 'Feedback recorded. Model will retrain on next session.',
        },
      }
    }

    throw new Error(`Mock API route not implemented: POST ${path}`)
  },

  get: async (url, config = {}) => {
    const path = toPath(url)
    const uploadId = config?.params?.upload_id

    if (path === '/results') {
      await wait(randomDelay())
      if (uploadId && resultRegistry[uploadId]) return { data: resultRegistry[uploadId] }
      return { data: lastResult }
    }

    if (path === '/export') {
      await wait(randomDelay())
      const current = uploadId ? (resultRegistry[uploadId] || lastResult) : lastResult
      const blob = toCsvBlob(current?.goldenRecords || [])
      return { data: blob }
    }

    if (path === '/audit') {
      await wait(randomDelay())
      const entries = uploadId ? (auditRegistry[uploadId] || []) : []
      return { data: { entries } }
    }

    if (path === '/stats') {
      await wait(randomDelay())
      if (uploadId && resultRegistry[uploadId]) return { data: resultRegistry[uploadId].stats || null }
      return { data: lastResult?.stats || null }
    }

    throw new Error(`Mock API route not implemented: GET ${path}`)
  },
}

export default client
