import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { DayRecord, Progress, Settings } from '@/lib/backup'
import {
  SCHEMA, downloadSnapshot, mergeProgress, migrate, parseSnapshot,
} from '@/lib/backup'
import { shiftDay, todayKey } from '@/lib/day'
import type { Mode } from '@/engine/questions'
import { DEFAULT_SETTINGS, poolFor } from '@/engine/questions'
import type { CardState } from '@/engine/srs'
import { review, summarise } from '@/engine/srs'

const STORAGE_KEY = 'gfd.progress.v1'
/** Last value that loaded cleanly, so one bad write cannot cost everything. */
const BACKUP_KEY = 'gfd.progress.backup'
/** Anything unparseable is parked here rather than thrown away. */
const QUARANTINE_KEY = 'gfd.progress.unreadable'

export type { DayRecord, Progress, Settings }
export { todayKey }

export const DEFAULT_PROGRESS: Progress = {
  version: SCHEMA,
  cards: {},
  days: {},
  totals: { answered: 0, correct: 0 },
  settings: {
    ...DEFAULT_SETTINGS,
    tolerateCase: false,
    tolerateAsciiUmlauts: true,
    sessionLength: 12,
  },
  lastMode: null,
}

/** Consecutive days ending today, or ending yesterday if today is still empty. */
export function streakOf(days: Record<string, DayRecord>, today = todayKey()): number {
  let cursor = days[today]?.answered ? today : shiftDay(today, -1)
  let count = 0
  while (days[cursor]?.answered) {
    count++
    cursor = shiftDay(cursor, -1)
  }
  return count
}

export interface StorageStatus {
  /** The browser promised not to evict this data. */
  persisted: boolean
  /** Bytes your progress itself takes up. Not the origin total, which is
   *  dominated by the precached offline assets and would be misleading here. */
  progressBytes: number
  /** True when a previous load found unreadable data and parked it. */
  recovered: boolean
}

function loadFrom(key: string): Progress | null {
  const raw = localStorage.getItem(key)
  if (!raw) return null
  return migrate(JSON.parse(raw), DEFAULT_PROGRESS)
}

/**
 * Reads stored progress. Never returns empty for data that exists: an
 * unrecognised version is migrated field by field, and unparseable text falls
 * back to the last good copy and is quarantined rather than overwritten.
 */
function read(): { progress: Progress; recovered: boolean } {
  try {
    const main = loadFrom(STORAGE_KEY)
    if (main) return { progress: main, recovered: false }
  } catch {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) localStorage.setItem(QUARANTINE_KEY, raw)
      const backup = loadFrom(BACKUP_KEY)
      if (backup) return { progress: backup, recovered: true }
    } catch {
      // Fall through to a clean start.
    }
    return { progress: DEFAULT_PROGRESS, recovered: true }
  }
  try {
    const backup = loadFrom(BACKUP_KEY)
    if (backup) return { progress: backup, recovered: true }
  } catch {
    // No usable backup either.
  }
  return { progress: DEFAULT_PROGRESS, recovered: false }
}

interface Store {
  progress: Progress
  settings: Settings
  streak: number
  storage: StorageStatus
  recordAnswer: (cardId: string, correct: boolean) => void
  updateSettings: (patch: Partial<Settings>) => void
  setLastMode: (mode: Mode) => void
  resetAll: () => void
  resetMode: (mode: Mode) => void
  summaryFor: (mode: Mode) => ReturnType<typeof summarise>
  exportProgress: () => void
  /** Returns how many cards the imported file contributed. */
  importProgress: (text: string, mode: 'merge' | 'replace') => number
  ready: boolean
}

const StoreContext = createContext<Store | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS)
  const [ready, setReady] = useState(false)
  const [storage, setStorage] = useState<StorageStatus>({
    persisted: false,
    progressBytes: 0,
    recovered: false,
  })
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const { progress: loaded, recovered } = read()
    setProgress(loaded)
    setStorage((prev) => ({ ...prev, recovered }))
    setReady(true)
  }, [])

  // Ask Chrome to treat this data as persistent, which exempts it from
  // eviction when the device runs low on space.
  useEffect(() => {
    let cancelled = false
    async function claim() {
      if (!navigator.storage?.persist) return
      try {
        const already = (await navigator.storage.persisted?.()) ?? false
        const persisted = already || (await navigator.storage.persist())
        if (!cancelled) setStorage((prev) => ({ ...prev, persisted }))
      } catch {
        // Storage manager unavailable; the app works, it is just evictable.
      }
    }
    void claim()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!ready) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      try {
        const previous = localStorage.getItem(STORAGE_KEY)
        if (previous) localStorage.setItem(BACKUP_KEY, previous)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
      } catch {
        // Out of quota or storage blocked. The session still works in memory.
      }
    }, 250)
    return () => window.clearTimeout(timer.current)
  }, [progress, ready])

  useEffect(() => {
    if (!ready) return
    const bytes = new TextEncoder().encode(JSON.stringify(progress)).length
    setStorage((prev) => (prev.progressBytes === bytes ? prev : { ...prev, progressBytes: bytes }))
  }, [progress, ready])

  const recordAnswer = useCallback((cardId: string, correct: boolean) => {
    setProgress((prev) => {
      const day = todayKey()
      const prevDay = prev.days[day] ?? { answered: 0, correct: 0 }
      return {
        ...prev,
        cards: { ...prev.cards, [cardId]: review(prev.cards[cardId], correct) },
        days: {
          ...prev.days,
          [day]: { answered: prevDay.answered + 1, correct: prevDay.correct + (correct ? 1 : 0) },
        },
        totals: {
          answered: prev.totals.answered + 1,
          correct: prev.totals.correct + (correct ? 1 : 0),
        },
      }
    })
  }, [])

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setProgress((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }))
  }, [])

  const setLastMode = useCallback((mode: Mode) => {
    setProgress((prev) => (prev.lastMode === mode ? prev : { ...prev, lastMode: mode }))
  }, [])

  const resetAll = useCallback(() => {
    setProgress((prev) => ({ ...DEFAULT_PROGRESS, settings: prev.settings }))
  }, [])

  const resetMode = useCallback((mode: Mode) => {
    setProgress((prev) => {
      const drop = new Set(poolFor(mode, prev.settings))
      const cards: Record<string, CardState> = {}
      for (const [id, card] of Object.entries(prev.cards)) {
        if (!drop.has(id)) cards[id] = card
      }
      return { ...prev, cards }
    })
  }, [])

  const exportProgress = useCallback(() => {
    downloadSnapshot(progress)
  }, [progress])

  const importProgress = useCallback((text: string, mode: 'merge' | 'replace') => {
    const incoming = parseSnapshot(text, DEFAULT_PROGRESS)
    let added = 0
    setProgress((prev) => {
      if (mode === 'replace') {
        added = Object.keys(incoming.cards).length
        return { ...incoming, settings: prev.settings }
      }
      const merged = mergeProgress(prev, incoming)
      added = Object.keys(merged.cards).length - Object.keys(prev.cards).length
      return merged
    })
    return added
  }, [])

  const value = useMemo<Store>(() => ({
    progress,
    settings: progress.settings,
    streak: streakOf(progress.days),
    storage,
    recordAnswer,
    updateSettings,
    setLastMode,
    resetAll,
    resetMode,
    summaryFor: (mode: Mode) => summarise(poolFor(mode, progress.settings), progress.cards),
    exportProgress,
    importProgress,
    ready,
  }), [progress, storage, ready, recordAnswer, updateSettings, setLastMode, resetAll, resetMode, exportProgress, importProgress])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useProgress(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useProgress must be used inside ProgressProvider')
  return store
}
