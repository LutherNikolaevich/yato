import { useRef, useState } from 'react'
import { DEFAULT_FILENAME } from '../schema'
import { Icon } from './Icon'

type Phase = 'idle' | 'working' | 'done' | 'error'

interface Props {
  count: number
  toCheck: number
  filename: string
  onFilename: (value: string) => void
  onReview: () => void
  onWorkbook: () => Promise<void>
  onPdf: () => Promise<void>
}

const BASE_DEFAULT = DEFAULT_FILENAME.replace(/\.xlsx$/i, '')

function ExportButton({
  label,
  primary,
  disabled,
  run,
}: {
  label: string
  primary?: boolean
  disabled: boolean
  run: () => Promise<void>
}) {
  const [phase, setPhase] = useState<Phase>('idle')
  const reset = useRef(0)

  const click = async () => {
    if (disabled || phase === 'working') return
    window.clearTimeout(reset.current)
    setPhase('working')
    try {
      await run()
      setPhase('done')
    } catch {
      setPhase('error')
    }
    reset.current = window.setTimeout(() => setPhase('idle'), 2200)
  }

  return (
    <button
      type="button"
      className={['export-btn', primary ? 'primary' : '', phase === 'done' ? 'stamped' : '', phase === 'error' ? 'failed' : '']
        .join(' ')
        .trim()}
      disabled={disabled || phase === 'working'}
      onClick={click}
    >
      <Icon name={phase === 'done' ? 'check' : primary ? 'sheet' : 'file'} size={18} />
      {phase === 'working'
        ? 'Writing…'
        : phase === 'done'
          ? 'Saved'
          : phase === 'error'
            ? 'Failed. Try again'
            : label}
    </button>
  )
}

export default function ExportPanel({ count, toCheck, filename, onFilename, onReview, onWorkbook, onPdf }: Props) {
  const disabled = count === 0

  return (
    <section className="panel" aria-labelledby="export-title">
      <div className="panel-head">
        <div className="title-block">
          <h2 id="export-title">
            {count ? `Download ${count} response${count === 1 ? '' : 's'}` : 'Nothing to download yet'}
          </h2>
          <p className="tally">Same 55 columns as the Google Forms sheet.</p>
        </div>
      </div>

      <div className="export-grid">
        <div className="export-form card">
          <label className="field">
            <span>File name</span>
            <span className="name-field">
              <input
                value={filename.replace(/\.(xlsx|pdf)$/i, '')}
                placeholder={BASE_DEFAULT}
                spellCheck={false}
                onChange={e => onFilename(e.target.value)}
              />
              <span className="ext" aria-hidden="true">
                .xlsx / .pdf
              </span>
            </span>
          </label>

          <div className="export-buttons">
            <ExportButton label="Download Excel" primary disabled={disabled} run={onWorkbook} />
            <ExportButton label="Download PDF" disabled={disabled} run={onPdf} />
          </div>

          {disabled ? (
            <p className="export-note">Add responses first.</p>
          ) : (
            toCheck > 0 && (
              <p className="export-note warn" role="note">
                {toCheck} cell{toCheck === 1 ? '' : 's'} still to check. They export as is.{' '}
                <button type="button" className="link" onClick={onReview}>
                  Review them
                </button>
              </p>
            )
          )}
        </div>
      </div>
    </section>
  )
}
