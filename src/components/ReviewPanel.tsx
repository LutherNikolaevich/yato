import { memo, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react'
import { COLUMNS, COLUMN_BY_ID, GROUPS, SECTIONS, type Column, type GroupId } from '../schema'
import type { ResponseRow } from '../types'
import { Icon } from './Icon'

interface Props {
  rows: ResponseRow[]
  toCheck: number
  jump: number
  onCell: (rowId: string, columnId: string, value: string) => void
  onAdd: () => void
  onDelete: (rowId: string) => void
  onClear: () => void
  onFill: (columnId: string, value: string, scope: 'empty' | 'all') => void
  onDocuments: () => void
}

interface Target {
  group: GroupId
  rowId: string
  colId: string
}

const MARKS = ['1', '2', '3', '4', '5']
const RAIL_MIN = 12

const columnsFor = (group: GroupId) => COLUMNS.filter(c => c.group === group && c.id !== 'name')

const ITEM_CODE = new Map(
  SECTIONS.flatMap(s => s.ids.map((id, i) => [id, `${s.title.split('.')[0]}.${i + 1}`] as const)),
)

const flagTitle = (kind: 'guess' | 'missing') => (kind === 'missing' ? 'Not found on the form. Fill it in.' : 'Unclear on the form. Please confirm.')

const cellId = (group: GroupId, rowId: string, colId: string) => `c-${group}-${rowId}-${colId}`

const still = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ||
  document.documentElement.hasAttribute('data-nomotion')

function Bubbles({ id, name, label, value, onChange }: {
  id: string
  name: string
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <div
      id={id}
      role="radiogroup"
      aria-label={label}
      className="bubbles"
      onKeyDown={e => {
        if ((e.key === 'Delete' || e.key === 'Backspace') && value) {
          e.preventDefault()
          onChange('')
        }
      }}
    >
      {MARKS.map(mark => (
        <label key={mark} className="bubble">
          <input
            type="radio"
            name={name}
            value={mark}
            checked={value === mark}
            onChange={() => onChange(mark)}
            onClick={() => value === mark && onChange('')}
          />
          <span>{mark}</span>
        </label>
      ))}
    </div>
  )
}

const Row = memo(function Row({ row, index, group, cols, onCell, onDelete }: {
  row: ResponseRow
  index: number
  group: GroupId
  cols: Column[]
  onCell: Props['onCell']
  onDelete: Props['onDelete']
}) {
  const who = row.values.name || `row ${index + 1}`
  const flagged = COLUMNS.filter(col => row.low[col.id])
  return (
    <tr className={flagged.length ? 'has-flags' : undefined}>
      <td className="no">{String(index + 1).padStart(2, '0')}</td>
      <td className={row.low.name ? 'person flagged' : 'person'} title={row.low.name ? flagTitle(row.low.name) : undefined}>
        <input
          id={cellId(group, row.id, 'name')}
          className="name-input"
          value={row.values.name ?? ''}
          placeholder="Participant name"
          title={row.source ? `From ${row.source}` : 'Added by hand'}
          aria-label={`Participant name, row ${index + 1}${row.low.name ? ', needs check' : ''}`}
          onChange={e => onCell(row.id, 'name', e.target.value)}
        />
        <span className={flagged.length ? 'status check inline' : 'status ready inline'} aria-hidden="true">
          {flagged.length ? `${flagged.length} to check` : 'Ready'}
        </span>
      </td>
      <td className="state">
        <span
          className={flagged.length ? 'status check' : 'status ready'}
          title={flagged.length ? `To check: ${flagged.map(col => col.label).join(', ')}` : 'Nothing to check'}
        >
          {flagged.length ? `${flagged.length} to check` : 'Ready'}
        </span>
      </td>
      {cols.map(col => {
        const flag = row.low[col.id]
        const label = `${col.label} for ${who}${flag ? ', needs check' : ''}`
        const value = row.values[col.id] ?? ''
        const id = cellId(group, row.id, col.id)
        const change = (next: string) => onCell(row.id, col.id, next)
        return (
          <td
            key={col.id}
            className={[col.type === 'rating' ? 'rate' : col.type === 'longtext' ? 'long' : '', flag ? 'flagged' : '']
              .join(' ')
              .trim() || undefined}
            title={flag ? flagTitle(flag) : undefined}
          >
            {col.type === 'rating' ? (
              <Bubbles id={id} name={`${group}-${row.id}-${col.id}`} label={label} value={value} onChange={change} />
            ) : col.type === 'longtext' ? (
              <textarea id={id} rows={2} value={value} aria-label={label} onChange={e => change(e.target.value)} />
            ) : (
              <input
                id={id}
                type={col.type === 'email' ? 'email' : 'text'}
                style={{ minWidth: `calc(${Math.max(col.width, 14) + 3}ch + 18px)` }}
                value={value}
                aria-label={label}
                onChange={e => change(e.target.value)}
              />
            )}
          </td>
        )
      })}
      <td className="actions">
        <button type="button" className="icon-btn danger" aria-label={`Delete response: ${who}`} title="Delete response" onClick={() => onDelete(row.id)}>
          <Icon name="trash" size={16} />
        </button>
      </td>
    </tr>
  )
})

function GroupTable({ group, rows, onCell, onDelete }: {
  group: GroupId
  rows: ResponseRow[]
  onCell: Props['onCell']
  onDelete: Props['onDelete']
}) {
  const cols = columnsFor(group)
  return (
    <div className="review-wrap">
      <table className="review-table">
        <thead>
          <tr>
            <th className="no" scope="col">
              Nº
            </th>
            <th className="person" scope="col">
              Participant
            </th>
            <th className="state" scope="col">
              Status
            </th>
            {cols.map(col => (
              <th key={col.id} scope="col" title={col.header} className={col.type === 'rating' ? 'rate' : col.type === 'longtext' ? 'long' : undefined}>
                {ITEM_CODE.has(col.id) && <span className="code">{ITEM_CODE.get(col.id)}</span>}
                <span className="col-label">{col.label}</span>
              </th>
            ))}
            <th className="actions" scope="col">
              <span className="sr-only">Row actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <Row key={row.id} row={row} index={i} group={group} cols={cols} onCell={onCell} onDelete={onDelete} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function ReviewPanel({ rows, toCheck, jump, onCell, onAdd, onDelete, onClear, onFill, onDocuments }: Props) {
  const [active, setActive] = useState<GroupId>('particulars')
  const [fillId, setFillId] = useState('region')
  const [fillValue, setFillValue] = useState('')
  const [scope, setScope] = useState<'empty' | 'all'>('empty')
  const [clearArmed, setClearArmed] = useState(false)
  const [target, setTarget] = useState<Target | null>(null)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])
  const cursor = useRef(-1)

  const fillCol = COLUMN_BY_ID.get(fillId)
  const flagsByGroup = Object.fromEntries(GROUPS.map(g => [g.id, 0])) as Record<GroupId, number>
  for (const row of rows)
    for (const id of Object.keys(row.low)) {
      const group = COLUMN_BY_ID.get(id)?.group
      if (group) flagsByGroup[group] += 1
    }
  const ready = rows.filter(row => !Object.keys(row.low).length).length

  useEffect(() => {
    tabRefs.current[GROUPS.findIndex(g => g.id === active)]?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: still() ? 'auto' : 'smooth',
    })
  }, [active])

  useEffect(() => {
    if (!target) return
    const el = document.getElementById(cellId(target.group, target.rowId, target.colId))
    const control = el?.matches('input, textarea')
      ? el
      : (el?.querySelector<HTMLInputElement>('input:checked') ?? el?.querySelector<HTMLInputElement>('input'))
    control?.focus({ preventScroll: true })
    el?.scrollIntoView({ block: 'center', inline: 'center', behavior: still() ? 'auto' : 'smooth' })
    setTarget(null)
  }, [target])

  const go = (next: Target) => {
    setActive(next.group)
    setTarget(next)
  }

  const nextToCheck = () => {
    const total = rows.length * COLUMNS.length
    for (let step = 1; step <= total; step++) {
      const at = (cursor.current + step) % total
      const row = rows[Math.floor(at / COLUMNS.length)]
      const col = COLUMNS[at % COLUMNS.length]
      if (row.low[col.id]) {
        cursor.current = at
        go({ group: col.group, rowId: row.id, colId: col.id })
        return
      }
    }
  }

  useEffect(() => {
    if (jump) nextToCheck()
  }, [jump])

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const at = GROUPS.findIndex(g => g.id === active)
    let next = -1
    if (e.key === 'ArrowRight') next = (at + 1) % GROUPS.length
    else if (e.key === 'ArrowLeft') next = (at - 1 + GROUPS.length) % GROUPS.length
    else if (e.key === 'Home') next = 0
    else if (e.key === 'End') next = GROUPS.length - 1
    if (next < 0) return
    e.preventDefault()
    setActive(GROUPS[next].id)
    tabRefs.current[next]?.focus()
  }

  const add = () => {
    onAdd()
    setActive('particulars')
  }

  return (
    <section className="panel" aria-labelledby="responses-title">
      <div className="panel-head">
        <div className="title-block">
          <h2 id="responses-title">
            <span className="sr-only">Responses: </span>
            {!rows.length ? (
              'No responses yet'
            ) : toCheck > 0 ? (
              <>
                <span className="count check">{toCheck}</span> to check
              </>
            ) : (
              <span className="done">All checked</span>
            )}
          </h2>
          {rows.length > 0 && (
            <p className="tally">
              {toCheck > 0 && `${ready} of `}
              {rows.length} response{rows.length === 1 ? '' : 's'} ready
            </p>
          )}
        </div>
        {rows.length > 0 && (
          <div className="panel-actions">
            <button type="button" onClick={add}>
              <Icon name="plus" size={16} />
              Add response
            </button>
          </div>
        )}
      </div>

      {rows.length === 0 ? (
        <div className="empty-state card">
          <p>Add forms in Documents, or type one in.</p>
          <div className="empty-actions">
            <button type="button" className="primary" onClick={onDocuments}>
              <Icon name="upload" size={16} />
              Add forms
            </button>
            <button type="button" onClick={add}>
              Add by hand
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="card">
            <div className="group-tabs" role="tablist" aria-label="Response sections">
              {GROUPS.map((group, i) => {
                const count = flagsByGroup[group.id]
                return (
                  <button
                    key={group.id}
                    ref={el => {
                      tabRefs.current[i] = el
                    }}
                    type="button"
                    role="tab"
                    id={`responses-tab-${group.id}`}
                    aria-selected={group.id === active}
                    aria-controls={`responses-${group.id}`}
                    tabIndex={group.id === active ? 0 : -1}
                    className="group-tab"
                    onClick={() => setActive(group.id)}
                    onKeyDown={onTabKey}
                  >
                    {group.label}
                    {count > 0 && (
                      <span className="flag-count" title={`${count} cell${count === 1 ? '' : 's'} to check`}>
                        <span className="sr-only">, </span>
                        {count}
                        <span className="sr-only"> to check</span>
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            <div className={rows.length >= RAIL_MIN ? 'review-body with-rail' : 'review-body'}>
              {rows.length >= RAIL_MIN && (
              <div className="rail" aria-hidden="true" style={{ '--rows': rows.length } as CSSProperties}>
                {rows.map((row, i) => (
                  <button
                    key={row.id}
                    type="button"
                    tabIndex={-1}
                    className={Object.keys(row.low).length ? 'tick on' : 'tick'}
                    title={`${String(i + 1).padStart(2, '0')} ${row.values.name || 'Unnamed'}`}
                    onClick={() => go({ group: active, rowId: row.id, colId: 'name' })}
                  />
                ))}
              </div>
              )}

              <div className="review-tables">
                {GROUPS.map(group => (
                  <div
                    key={group.id}
                    role="tabpanel"
                    id={`responses-${group.id}`}
                    aria-labelledby={`responses-tab-${group.id}`}
                    hidden={group.id !== active}
                  >
                    {columnsFor(group.id).length > 6 && <p className="scroll-note">Scroll sideways for more</p>}
                    <GroupTable group={group.id} rows={rows} onCell={onCell} onDelete={onDelete} />
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="review-foot">
            <details className="bulk">
              <summary>Fill a column</summary>
              <div className="bulk-controls">
                <label className="field">
                  <span>Column</span>
                  <select
                    value={fillId}
                    onChange={e => {
                      setFillId(e.target.value)
                      setFillValue('')
                    }}
                  >
                    {GROUPS.map(group => (
                      <optgroup key={group.id} label={group.label}>
                        {COLUMNS.filter(c => c.group === group.id).map(col => (
                          <option key={col.id} value={col.id}>
                            {ITEM_CODE.has(col.id) ? `${ITEM_CODE.get(col.id)} ${col.label}` : col.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </label>
                <label className="field">
                  <span>Value</span>
                  {fillCol?.type === 'rating' ? (
                    <select value={fillValue} onChange={e => setFillValue(e.target.value)}>
                      <option value="">–</option>
                      {MARKS.map(mark => (
                        <option key={mark} value={mark}>
                          {mark}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input value={fillValue} onChange={e => setFillValue(e.target.value)} />
                  )}
                </label>
                <label className="field">
                  <span>Apply to</span>
                  <select value={scope} onChange={e => setScope(e.target.value as 'empty' | 'all')}>
                    <option value="empty">Empty cells only</option>
                    <option value="all">All responses</option>
                  </select>
                </label>
                <button type="button" onClick={() => onFill(fillId, fillValue, scope)} disabled={!fillValue && scope === 'empty'}>
                  {!fillValue && scope === 'all' ? 'Clear column' : 'Fill column'}
                </button>
              </div>
            </details>

            <div className="clear-zone">
              {clearArmed ? (
                <>
                  <span>
                    Delete all {rows.length} response{rows.length === 1 ? '' : 's'}? This can’t be undone.
                  </span>
                  <button
                    type="button"
                    className="danger solid"
                    onClick={() => {
                      onClear()
                      setClearArmed(false)
                    }}
                  >
                    Delete all
                  </button>
                  <button type="button" onClick={() => setClearArmed(false)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="button" className="danger" onClick={() => setClearArmed(true)}>
                  <Icon name="trash" size={16} />
                  Delete all
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
