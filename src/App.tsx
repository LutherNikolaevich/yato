import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react'
import ExportPanel from './components/ExportPanel'
import ReviewPanel from './components/ReviewPanel'
import UploadPanel from './components/UploadPanel'
import { mergeRows, toRows, uid } from './lib/parse'
import { DEFAULT_FILENAME, RATING_IDS } from './schema'
import { blankValues, loadState, saveState } from './storage'
import type { Confidence, Job, ResponseRow } from './types'
import './App.css'

const RATINGS = new Set(RATING_IDS.courseRatings.concat(RATING_IDS.resource))
const seedParam = new URLSearchParams(location.search).get('seed')
const seeded = seedParam !== null
const seedCount = Math.min(Math.max(Number(seedParam) || 3, 1), 500)
const FIRST = ['Ana', 'Ben', 'Carla', 'Dante', 'Elena', 'Felix', 'Grace', 'Hector', 'Iris', 'Jose']
const LAST = ['Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres', 'Villanueva', 'Ramos', 'Aquino']

const seedRows: ResponseRow[] = [
  {
    name: 'Marc Webster Abella',
    email: 'marc.abella@example.gov.ph',
    age: '31 - 40',
    gender: 'MALE',
  },
  {
    name: 'Angelica Sanchez',
    email: 'angelica.sanchez@example.gov.ph',
    age: '20 - 30',
    gender: 'FEMALE',
  },
  {
    name: 'Bryan P. Sarangay',
    email: 'bryan.sarangay@example.gov.ph',
    age: '31 - 40',
    gender: 'MALE',
  },
  ...Array.from({ length: Math.max(seedCount - 3, 0) }, (_, k) => {
    const name = `${FIRST[k % 10]} ${LAST[Math.floor(k / 10) % 10]}${k >= 100 ? ` ${Math.floor(k / 100) + 1}` : ''}`
    return {
      name,
      email: `${name.toLowerCase().replace(/ /g, '.')}@example.gov.ph`,
      age: k % 3 ? '31 - 40' : '20 - 30',
      gender: k % 2 ? 'MALE' : 'FEMALE',
    }
  }),
].slice(0, seedCount).map((person, i) => {
  const values = blankValues()
  Object.assign(values, {
    timestamp: `2026-08-20 ${String(8 + Math.floor(i / 60)).padStart(2, '0')}:${String(i % 60).padStart(2, '0')}:12.000`,
    email: person.email,
    consent: 'AGREE',
    name: person.name,
    region: 'REGION II - CAGAYAN VALLEY',
    age: person.age,
    gender: person.gender,
    citizenship: 'Filipino',
    socialCategory: 'Local Government Unit',
    question1: 'Everything was useful, especially the hands-on exercises.',
    question2: 'N/A',
    question3: 'More time on the AI tools.',
    question4: 'N/A',
    question5: 'Keep the same trainers.',
    question6: 'Yes',
    question7: '1. Train my office\n2. Share the materials\n3. Review the workflows',
    question8: 'Thank you.',
  })
  for (const id of RATINGS) values[id] = i === 2 ? '3' : i < 3 ? '4' : String(3 + (i % 3))
  values.course18 = '5'
  values.resource19 = '5'
  const low: Record<string, Confidence> =
    i === 1 || i % 7 === 1 ? { resource9: 'guess' } : i === 2 ? { question5: 'missing' } : {}
  return {
    id: `seed-${i + 1}`,
    source: `Evaluation - ${person.name}.pdf`,
    values,
    low,
  }
})

const PAPERS = [
  { id: 'documents', label: 'Documents' },
  { id: 'responses', label: 'Responses' },
  { id: 'export', label: 'Export' },
] as const
type PaperId = (typeof PAPERS)[number]['id']

const initial = seeded
  ? { rows: seedRows, filename: DEFAULT_FILENAME }
  : (loadState() ?? { rows: [], filename: DEFAULT_FILENAME })
initial.rows = mergeRows(initial.rows)

function replaceSource(previous: ResponseRow[], source: string, next: ResponseRow[]): ResponseRow[] {
  const at = previous.findIndex(r => r.source === source)
  if (at < 0) return [...previous, ...next]
  const others = previous.filter(r => r.source !== source)
  const before = previous.slice(0, at).filter(r => r.source !== source).length
  return [...others.slice(0, before), ...next, ...others.slice(before)]
}

function reflag(row: ResponseRow, columnId: string, value: string): ResponseRow {
  const low = { ...row.low }
  if (!value && (columnId === 'name' || RATINGS.has(columnId))) low[columnId] = 'missing'
  else delete low[columnId]
  return { ...row, values: { ...row.values, [columnId]: value }, low }
}

export default function App() {
  const [rows, setRows] = useState<ResponseRow[]>(initial.rows)
  const [filename, setFilename] = useState(initial.filename)
  const [jobs, setJobs] = useState<Job[]>([])
  const [paper, setPaper] = useState<PaperId>(initial.rows.length ? 'responses' : 'documents')
  const [jump, setJump] = useState(0)
  const paperRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (seeded) return
    const timer = setTimeout(() => saveState({ rows, filename }), 300)
    return () => clearTimeout(timer)
  }, [rows, filename])

  const patchJob = (id: string, patch: Partial<Job>) =>
    setJobs(previous => previous.map(job => (job.id === id ? { ...job, ...patch } : job)))

  const addFiles = async (files: File[]) => {
    const queued: Job[] = files.map(file => ({
      id: uid('job'),
      fileName: file.name,
      size: file.size,
      status: 'queued',
    }))
    setJobs(previous => [...previous, ...queued])
    let read = 0
    let failed = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const job = queued[i]
      patchJob(job.id, { status: 'reading', detail: 'Opening file…' })
      try {
        const { extractDocument } = await import('./lib/documents')
        const result = await extractDocument(file, (detail, status) =>
          patchJob(job.id, { status, detail }),
        )
        const parsed = toRows(result.text, file.name)
        const filled = parsed.filter(row => Object.values(row.values).filter(Boolean).length >= 3)
        if (!filled.length) throw new Error('No answers found. Is this a filled evaluation form?')
        setRows(previous => mergeRows(replaceSource(previous, file.name, filled)))
        patchJob(job.id, {
          status: 'done',
          detail: `${result.pages} page${result.pages === 1 ? '' : 's'}${result.ocr ? ', scanned' : ''}`,
          rows: filled.length,
        })
        read += 1
      } catch (error) {
        failed += 1
        patchJob(job.id, {
          status: 'error',
          detail: error instanceof Error ? error.message : 'Couldn’t read this file. Try again, or type the answers in Responses.',
        })
      }
    }
    if (read && !failed) setPaper(current => (current === 'documents' ? 'responses' : current))
  }

  const updateCell = useCallback(
    (rowId: string, columnId: string, value: string) =>
      setRows(previous => previous.map(row => (row.id === rowId ? reflag(row, columnId, value) : row))),
    [],
  )
  const deleteRow = useCallback((rowId: string) => setRows(previous => previous.filter(row => row.id !== rowId)), [])

  const addRow = () => {
    const values = blankValues()
    setRows(previous => [
      ...previous,
      { id: uid(), source: '', values, low: { name: 'missing' } },
    ])
  }

  const fillColumn = (columnId: string, value: string, scope: 'empty' | 'all') =>
    setRows(previous =>
      previous.map(row => (scope === 'empty' && row.values[columnId] ? row : reflag(row, columnId, value))),
    )

  const toCheck = rows.reduce((count, row) => count + Object.keys(row.low).length, 0)

  const onPaperKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const at = PAPERS.findIndex(p => p.id === paper)
    let next = -1
    if (e.key === 'ArrowRight') next = (at + 1) % PAPERS.length
    else if (e.key === 'ArrowLeft') next = (at - 1 + PAPERS.length) % PAPERS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = PAPERS.length - 1
    if (next < 0) return
    e.preventDefault()
    setPaper(PAPERS[next].id)
    paperRefs.current[next]?.focus()
  }

  const sheet = (id: PaperId) => ({
    id: `paper-${id}`,
    role: 'tabpanel',
    'aria-labelledby': `paper-tab-${id}`,
    className: 'sheet',
    hidden: paper !== id,
  })

  const reading = jobs.filter(job => job.status === 'queued' || job.status === 'reading' || job.status === 'ocr').length
  const meta: Record<PaperId, string> = {
    documents: reading ? `Reading ${reading}…` : jobs.length ? String(jobs.length) : '',
    responses: rows.length ? String(rows.length) : '',
    export: '',
  }

  return (
    <div className="app">
      <header className="bar">
        <h1 className="mark">yato</h1>
        <div className="steps" role="tablist" aria-label="Steps">
          {PAPERS.map((p, i) => (
            <button
              key={p.id}
              ref={el => {
                paperRefs.current[i] = el
              }}
              type="button"
              role="tab"
              id={`paper-tab-${p.id}`}
              className="step"
              aria-selected={paper === p.id}
              aria-controls={`paper-${p.id}`}
              tabIndex={paper === p.id ? 0 : -1}
              onClick={() => setPaper(p.id)}
              onKeyDown={onPaperKey}
            >
              {p.label}
              {meta[p.id] && <span className="step-meta">{meta[p.id]}</span>}
              {p.id === 'responses' && toCheck > 0 && (
                <span className="flag-count">
                  {toCheck}
                  <span className="sr-only"> to check</span>
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="bar-actions">
          <button
            type="button"
            className={toCheck ? 'primary' : undefined}
            disabled={!toCheck}
            onClick={() => {
              setPaper('responses')
              setJump(n => n + 1)
            }}
          >
            {toCheck || !rows.length ? 'Next to check' : 'All checked'}
          </button>
        </div>
      </header>

      <main className="sheets">
        <div {...sheet('documents')}>
          <UploadPanel
            jobs={jobs}
            onFiles={addFiles}
            onDismiss={id => setJobs(previous => previous.filter(job => job.id !== id))}
          />
        </div>
        <div {...sheet('responses')}>
          <ReviewPanel
            rows={rows}
            toCheck={toCheck}
            jump={jump}
            onCell={updateCell}
            onAdd={addRow}
            onDelete={deleteRow}
            onClear={() => setRows([])}
            onFill={fillColumn}
            onDocuments={() => setPaper('documents')}
          />
        </div>
        <div {...sheet('export')}>
          <ExportPanel
            count={rows.length}
            toCheck={toCheck}
            filename={filename}
            onFilename={setFilename}
            onReview={() => setPaper('responses')}
            onWorkbook={() => import('./lib/xlsx').then(m => m.downloadWorkbook(rows, filename))}
            onPdf={() => import('./lib/pdf').then(m => m.downloadPdf(rows, filename))}
          />
        </div>
      </main>
    </div>
  )
}
