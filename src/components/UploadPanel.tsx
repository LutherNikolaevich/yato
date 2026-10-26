import { useEffect, useRef, useState, type DragEvent } from 'react'
import type { Job } from '../types'
import { Icon } from './Icon'

interface Props {
  jobs: Job[]
  onFiles: (files: File[]) => void
  onDismiss: (id: string) => void
}

const STATUS_LABEL: Record<Job['status'], string> = {
  queued: 'Waiting',
  reading: 'Reading',
  ocr: 'Reading scan',
  done: 'Done',
  error: 'Couldn’t read',
}

const sizeLabel = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`

export default function UploadPanel({ jobs, onFiles, onDismiss }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)
  const [reject, setReject] = useState<string | null>(null)

  useEffect(() => {
    const block = (e: globalThis.DragEvent) => e.preventDefault()
    window.addEventListener('dragover', block)
    window.addEventListener('drop', block)
    return () => {
      window.removeEventListener('dragover', block)
      window.removeEventListener('drop', block)
    }
  }, [])

  const accept = (files: FileList | null) => {
    if (!files?.length) return
    const list = Array.from(files)
    const good = list.filter(f => /\.(pdf|docx)$/i.test(f.name))
    const bad = list.length - good.length
    setReject(bad ? `Skipped ${bad} file${bad === 1 ? '' : 's'}. Only .pdf and .docx can be read.` : null)
    if (good.length) onFiles(good)
  }

  const drop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setOver(false)
    accept(e.dataTransfer.files)
  }

  return (
    <section className="panel" aria-labelledby="documents-title">
      <div className="panel-head">
        <div className="title-block">
          <h2 id="documents-title">Add the filled forms</h2>
          <p className="tally">One per participant. Files never leave this browser.</p>
        </div>
      </div>

      <div className="docs-grid">
        <div
          className={over ? 'dropzone over' : 'dropzone'}
          onDragEnter={e => {
            e.preventDefault()
            setOver(true)
          }}
          onDragOver={e => e.preventDefault()}
          onDragLeave={e => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setOver(false)
          }}
          onDrop={drop}
        >
          <p className="drop-title">{over ? 'Let go to read them' : 'Drop forms here'}</p>
          <p className="drop-copy">.pdf or .docx. Scans need an internet connection.</p>
          <button type="button" className="primary" onClick={() => input.current?.click()}>
            <Icon name="upload" size={18} />
            Choose files
          </button>
          <input
            ref={input}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            multiple
            hidden
            onChange={e => {
              accept(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        <aside className="docs-aside card">
          <ul className="how">
            <li>Each form becomes one response.</li>
            <li>
              Unclear answers are marked <mark className="check">to check</mark>.
            </li>
            <li>Same name, same response.</li>
          </ul>
          <div className="blank-form">
            <p>
              <strong>No forms yet?</strong> Fill a blank one in Word, or print it.
            </p>
            <button
              type="button"
              onClick={() =>
                import('../lib/form')
                  .then(m => m.downloadBlankForm())
                  .catch(() => setReject('Couldn’t create the blank form. Try again.'))
              }
            >
              <Icon name="download" size={18} />
              Download blank form
            </button>
          </div>
        </aside>
      </div>

      {reject && (
        <p className="form-error" role="alert">
          {reject}
        </p>
      )}

      {jobs.length > 0 && (
        <div className="files card">
          <h3>Files</h3>
          <ul className="file-list">
            {jobs.map(job => (
              <li key={job.id} className={`file-row status-${job.status}`}>
                <span className="file-icon" aria-hidden="true">
                  <Icon name={job.status === 'done' ? 'check' : job.status === 'error' ? 'close' : 'file'} size={16} />
                </span>
                <span className="file-name" title={job.fileName}>
                  {job.fileName}
                </span>
                <span className="file-size">{sizeLabel(job.size)}</span>
                <span className="file-status" aria-live="polite">
                  <strong>{STATUS_LABEL[job.status]}</strong>
                  {job.detail && <span className="file-detail">{job.detail}</span>}
                </span>
                <span className="file-rows">
                  {job.status === 'done' && job.rows !== undefined ? `${job.rows} response${job.rows === 1 ? '' : 's'}` : ''}
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  onClick={() => onDismiss(job.id)}
                  aria-label={`Remove ${job.fileName} from this list`}
                  title="Remove from list"
                >
                  <Icon name="close" size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}
