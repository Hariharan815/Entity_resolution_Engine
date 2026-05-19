import { create } from 'zustand'
import { saveSession, generateSessionId } from '../hooks/useSessions'

const HISTORY_KEY = 'entity-re-history-v1'

const loadSessionHistory = () => {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const saveSessionHistory = (history) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history))
  } catch {
    // Ignore storage errors (quota/private mode) and keep in-memory state working.
  }
}

const appendSessionMessage = (history, sessionId, message) =>
  history.map((s) =>
    s.id === sessionId
      ? {
          ...s,
          updatedAt: message.ts,
          messages: [...(s.messages || []), message],
        }
      : s
  )

const useStore = create((set, get) => ({
  // Upload state
  uploadedFile: null,
  uploadedFiles: [],
  rawData: [],
  totalRows: 0,
  headers: [],
  uploadId: null,

  // Resolution state
  isResolving: false,
  resolveProgress: 0,
  goldenRecords: [],
  duplicateGroups: [],
  stats: null,

  // Review state
  reviewQueue: [],
  currentReviewIdx: 0,

  // Audit state
  auditLog: [],

  // UI state
  activeStep: 1,
  sidebarOpen: true,
  currentSessionId: null,
  user: null,
  showAuthModal: null,

  // Persistent chat-like history state
  sessionHistory: loadSessionHistory(),
  selectedSessionId: null,

  // Actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setUser: (user) => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem('ere_user', JSON.stringify(user))
      } catch {
        // Keep app usable if localStorage is unavailable.
      }
    }
    set({ user, showAuthModal: null })
  },

  clearUser: () => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem('ere_user')
      } catch {
        // Keep app usable if localStorage is unavailable.
      }
    }
    set({ user: null })
  },

  openAuthModal: (mode) => set({ showAuthModal: mode }),

  closeAuthModal: () => set({ showAuthModal: null }),

  setUpload: (files, rows, headers) =>
    set((state) => {
      const fileList = Array.isArray(files) ? files : [files]
      const safeFiles = fileList.filter(Boolean)
      const filenames = safeFiles.map((f) => f?.name).filter(Boolean)
      const sessionTitle = filenames.length > 1
        ? `${filenames[0]} + ${filenames[1]}${filenames.length > 2 ? ` +${filenames.length - 2}` : ''}`
        : (filenames[0] || 'Uploaded Dataset')

      const now = new Date().toISOString()
      const sessionId = `s-${Date.now()}`
      const currentSessionId = generateSessionId()
      const newSession = {
        id: sessionId,
        title: sessionTitle,
        fileName: sessionTitle,
        filenames,
        createdAt: now,
        updatedAt: now,
        stats: null,
        messages: [
          {
            role: 'user',
            ts: now,
            text: `Uploaded ${filenames.length || 1} dataset${filenames.length === 1 ? '' : 's'} (${rows.length.toLocaleString()} rows, ${headers.length} columns).`,
          },
          {
            role: 'assistant',
            ts: now,
            text: 'Preview ready. Click Run Entity Resolution to generate golden records.',
          },
        ],
      }

      const sessionHistory = [newSession, ...state.sessionHistory].slice(0, 25)
      saveSessionHistory(sessionHistory)

      return {
        uploadedFiles: safeFiles,
        uploadedFile: safeFiles[0] || null,
        rawData: rows,
        totalRows: rows.length,
        headers,
        uploadId: null,
        isResolving: false,
        resolveProgress: 0,
        goldenRecords: [],
        duplicateGroups: [],
        stats: null,
        reviewQueue: [],
        currentReviewIdx: 0,
        activeStep: 1,
        currentSessionId,
        selectedSessionId: sessionId,
        sessionHistory,
      }
    }),

  setUploadId: (id) => set({ uploadId: id }),

  setTotalRows: (n) => set({ totalRows: Number.isFinite(n) ? n : 0 }),

  setResolving: (val) =>
    set((state) => {
      if (!val || !state.selectedSessionId) return { isResolving: val }

      const ts = new Date().toISOString()
      const sessionHistory = appendSessionMessage(state.sessionHistory, state.selectedSessionId, {
        role: 'assistant',
        ts,
        text: 'Running entity resolution: candidate blocking, scoring, and merge construction in progress.',
      })
      saveSessionHistory(sessionHistory)
      return { isResolving: val, sessionHistory }
    }),

  setResults: ({ goldenRecords, duplicateGroups, stats, reviewQueue }) =>
    set((state) => {
      const ts = new Date().toISOString()
      const normalizedGolden = Array.isArray(goldenRecords) ? goldenRecords : []
      const normalizedGroups = Array.isArray(duplicateGroups) ? duplicateGroups : []
      const fallbackSources = (state.uploadedFiles || []).map((f) => f?.name).filter(Boolean)
      const incomingStats = stats || {}
      const normalizedStats = {
        ...incomingStats,
        sources: Array.isArray(incomingStats.sources) && incomingStats.sources.length
          ? incomingStats.sources
          : fallbackSources,
        original: (incomingStats.original == null || Number(incomingStats.original) <= 0)
          ? (state.totalRows || state.rawData.length || 0)
          : Number(incomingStats.original),
      }
      const normalizedQueue = Array.isArray(reviewQueue)
        ? reviewQueue
        : normalizedGroups.filter((group) => group.confidence >= 0.5 && group.confidence <= 0.84)

      saveSession({
        id: state.currentSessionId || generateSessionId(),
        name: state.uploadedFiles?.length > 1
          ? `${state.uploadedFiles[0].name} + ${state.uploadedFiles[1].name}${state.uploadedFiles.length > 2 ? ` +${state.uploadedFiles.length - 2}` : ''}`
          : (state.uploadedFile?.name || 'Untitled Session'),
        date: ts,
        stats: normalizedStats || null,
        goldenRecords: normalizedGolden,
        duplicateGroups: normalizedGroups,
        filenames: (state.uploadedFiles || []).map((f) => f?.name).filter(Boolean),
      })

      let sessionHistory = state.sessionHistory
      if (state.selectedSessionId) {
        sessionHistory = appendSessionMessage(sessionHistory, state.selectedSessionId, {
          role: 'assistant',
          ts,
          text: `Resolution complete. Original: ${normalizedStats?.original ?? 0}, Golden: ${normalizedStats?.golden ?? normalizedGolden.length}, Accuracy: ${typeof normalizedStats?.accuracy === 'number' ? normalizedStats.accuracy.toFixed(2) : '0.00'}.`,
        }).map((s) =>
          s.id === state.selectedSessionId
            ? { ...s, stats: normalizedStats || null }
            : s
        )
      }
      saveSessionHistory(sessionHistory)

      return {
        goldenRecords: normalizedGolden,
        duplicateGroups: normalizedGroups,
        stats: normalizedStats,
        reviewQueue: normalizedQueue,
        activeStep: 2,
        sessionHistory,
      }
    }),

  setSelectedSessionId: (id) => set({ selectedSessionId: id }),

  restoreSessionSnapshot: (session) => set({
    goldenRecords: session?.goldenRecords || [],
    duplicateGroups: session?.duplicateGroups || [],
    stats: session?.stats || null,
    isResolving: false,
    activeStep: 2,
  }),

  restoreSession: (session) => set({
    goldenRecords: session?.goldenRecords || [],
    duplicateGroups: session?.duplicateGroups || [],
    stats: session?.stats || null,
    reviewQueue: (session?.duplicateGroups || []).filter((group) => group.confidence >= 0.5 && group.confidence <= 0.84),
    currentReviewIdx: 0,
    auditLog: [],
    activeStep: 2,
    currentSessionId: session?.id || null,
    uploadedFile: { name: session?.name || 'Untitled Session' },
    uploadedFiles: (session?.filenames || []).map((name) => ({ name })),
    isResolving: false,
  }),

  addFeedback: (decision) => {
    const { auditLog, sessionHistory, selectedSessionId } = get()
    const nextLog = [decision, ...auditLog]

    if (!selectedSessionId) {
      set({ auditLog: nextLog })
      return
    }

    const ts = decision.timestamp || new Date().toISOString()
    const nextHistory = appendSessionMessage(sessionHistory, selectedSessionId, {
      role: 'user',
      ts,
      text: `Review decision: ${decision.decision} on group #${decision.groupId}${decision.notes ? ` (${decision.notes})` : ''}.`,
    })
    saveSessionHistory(nextHistory)
    set({ auditLog: nextLog, sessionHistory: nextHistory })
  },

  nextReview: () => {
    const { currentReviewIdx, reviewQueue } = get()
    if (currentReviewIdx < reviewQueue.length - 1)
      set({ currentReviewIdx: currentReviewIdx + 1 })
  },

  prevReview: () => {
    const { currentReviewIdx } = get()
    if (currentReviewIdx > 0)
      set({ currentReviewIdx: currentReviewIdx - 1 })
  },

  reset: () => set({
    uploadedFile: null, uploadedFiles: [], rawData: [], totalRows: 0, headers: [], uploadId: null,
    isResolving: false, resolveProgress: 0, goldenRecords: [],
    duplicateGroups: [], stats: null, reviewQueue: [],
    currentReviewIdx: 0, auditLog: [], activeStep: 1,
    currentSessionId: generateSessionId(),
  }),
}))

export default useStore
