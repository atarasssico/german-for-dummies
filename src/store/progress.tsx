import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { CardState } from '@/engine/srs'
import { review, summarise } from '@/engine/srs'
import type { GenSettings, Mode } from '@/engine/questions'
import { DEFAULT_SETTINGS, poolFor } from '@/engine/questions'

const STORAGE_KEY = 'gfd.progress.v1'
const SCHEMA = 1

export interface Settings extends GenSettings {
  /** Let a lowercase noun pass. Off by default: capitalisation is grammar here. */
  tolerateCase: boolean
  /** Let ae/oe/ue/ss stand in for ä/ö/ü/ß. On by default: that is a keyboard problem. */
  tolerateAsciiUmlauts: boolean
  sessionLength: number
}

export interface DayRecord {
  answered: number
  correct: number
}

export interface Progress {
  version: number
  cards: Record<string, CardState>
  days: Record<string, DayRecord>
  totals: DayRecord
  settings: Settings
  /** Mode the user was last in, so the app can offer to carry on. */
  lastMode: Mode | null
}

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

export function todayKey(date = new Date()): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function shiftDay(key: string, days: number): string {
  const [y, m, d] = key.split('-').map(Number)
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
  date.setDate(date.getDate() + days)
  return todayKey(date)
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

function read(): Progress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROGRESS
    const parsed = JSON.parse(raw) as Partial<Progress>
    if (parsed.version !== SCHEMA) return DEFAULT_PROGRESS
    return {
      ...DEFAULT_PROGRESS,
      ...parsed,
      cards: parsed.cards ?? {},
      days: parsed.days ?? {},
      totals: parsed.totals ?? { answered: 0, correct: 0 },
      settings: { ...DEFAULT_PROGRESS.settings, ...parsed.settings },
    }
  } catch {
    // A private window, cleared site data, or storage that throws on access.
    return DEFAULT_PROGRESS
  }
}

interface Store {
  progress: Progress
  settings: Settings
  streak: number
  recordAnswer: (cardId: string, correct: boolean) => void
  updateSettings: (patch: Partial<Settings>) => void
  setLastMode: (mode: Mode) => void
  resetAll: () => void
  resetMode: (mode: Mode) => void
  summaryFor: (mode: Mode) => ReturnType<typeof summarise>
  /** True until the first read from storage has landed. */
  ready: boolean
}

const StoreContext = createContext<Store | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(DEFAULT_PROGRESS)
  const [ready, setReady] = useState(false)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    setProgress(read())
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
      } catch {
        // Out of quota or storage blocked: the session still works, it just will not persist.
      }
    }, 250)
    return () => window.clearTimeout(timer.current)
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

  const value = useMemo<Store>(() => ({
    progress,
    settings: progress.settings,
    streak: streakOf(progress.days),
    recordAnswer,
    updateSettings,
    setLastMode,
    resetAll,
    resetMode,
    summaryFor: (mode: Mode) => summarise(poolFor(mode, progress.settings), progress.cards),
    ready,
  }), [progress, ready, recordAnswer, updateSettings, setLastMode, resetAll, resetMode])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useProgress(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useProgress must be used inside ProgressProvider')
  return store
}
