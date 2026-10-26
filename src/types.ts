import type { GroupId } from './schema'

export type Confidence = 'guess' | 'missing'

export interface ResponseRow {
  id: string
  source: string
  values: Record<string, string>
  low: Record<string, Confidence>
}

export type JobStatus = 'queued' | 'reading' | 'ocr' | 'done' | 'error'

export interface Job {
  id: string
  fileName: string
  size: number
  status: JobStatus
  detail?: string
  rows?: number
}

export interface GroupView {
  id: GroupId
  label: string
}
