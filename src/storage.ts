import { COLUMNS, DEFAULT_FILENAME } from './schema'
import type { Confidence, ResponseRow } from './types'

export interface AppState {
  rows: ResponseRow[]
  filename: string
}

const KEY = 'evaluation-intake-v1'
const COLUMN_IDS = new Set(COLUMNS.map(c => c.id))
const CONFIDENCE = new Set<Confidence>(['guess', 'missing'])

const asRow = (raw: unknown): ResponseRow | null => {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  if (typeof r.id !== 'string' || typeof r.values !== 'object' || r.values === null) return null
  const values: Record<string, string> = {}
  const low: Record<string, Confidence> = {}
  for (const [key, value] of Object.entries(r.values)) {
    if (COLUMN_IDS.has(key) && typeof value === 'string') values[key] = value
  }
  if (typeof r.low === 'object' && r.low !== null) {
    for (const [key, value] of Object.entries(r.low)) {
      if (COLUMN_IDS.has(key) && CONFIDENCE.has(value as Confidence))
        low[key] = value as Confidence
    }
  }
  return {
    id: r.id,
    source: typeof r.source === 'string' ? r.source : '',
    values,
    low,
  }
}

function coerce(raw: unknown): AppState | null {
  if (typeof raw !== 'object' || raw === null) return null
  const s = raw as Record<string, unknown>
  if (!Array.isArray(s.rows)) return null
  return {
    rows: s.rows.map(asRow).filter((r): r is ResponseRow => r !== null),
    filename: typeof s.filename === 'string' && s.filename.trim() ? s.filename : DEFAULT_FILENAME,
  }
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? coerce(JSON.parse(raw)) : null
  } catch {
    return null
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {
  }
}

export function blankValues(): Record<string, string> {
  return Object.fromEntries(COLUMNS.map(c => [c.id, '']))
}
