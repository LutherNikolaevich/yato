import { COLUMNS, RATING_IDS, SECTIONS, type Column, type Section } from '../schema'
import type { Confidence, ResponseRow } from '../types'

export interface ParsedRow {
  values: Record<string, string>
  low: Record<string, Confidence>
}

const WORD_RATINGS: Record<string, string> = {
  excellent: '5',
  'very satisfactory': '4',
  satisfactory: '3',
  fair: '2',
  poor: '1',
  'strongly agree': '5',
  agree: '4',
  neutral: '3',
  disagree: '2',
  'strongly disagree': '1',
}

const NOISE = [
  /^page\s+\d+(?:\s+of\s+\d+)?$/i,
  /^page\s+\d+\s*\/\s*\d+$/i,
  /^ict literacy and competency development bureau$/i,
  /^department of information and communications technology$/i,
  /^republic of the philippines$/i,
  /^ilcdb\b/i,
  /^dict\b/i,
  /^https?:\/\//i,
  /^www\./i,
  /^tele(?:phone|fax)\b/i,
  /^email:\s*\S+@\S+$/i,
  /^\d{3,4}\s+.*\b(?:street|st\.?|avenue|ave\.?|road|rd\.?)\b/i,
  /^(?:course|training)\s+(?:feedback|evaluation|assessment)(?:\s+form)?$/i,
  /^(?:resource person|facilitator|trainer)\s+(?:evaluation|assessment)(?:\s+form)?$/i,
  /^(?:participant|respondent)\s+(?:details|information)$/i,
]

const isNoise = (line: string) => NOISE.some(re => re.test(line.trim()))

export function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const stripLead = (s: string) =>
  s
    .replace(/^[\s•▪●○☐☑✓✔*]+/, '')
    .replace(/^[ivx]+\.?\s+[^\[]*\[/i, '')
    .replace(/^\s*\(?\d{1,2}\)?[.),]\s+/, '')
    .replace(/^\s*[ivx]{1,5}[.)]\s+/i, '')
    .trim()

function normalizeWithMap(s: string): { text: string; map: number[] } {
  let text = ''
  const map: number[] = []
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
    if (/[a-z0-9]/.test(c)) {
      text += c
      map.push(i)
    } else if (text && !text.endsWith(' ')) {
      text += ' '
      map.push(i)
    }
  }
  while (text.endsWith(' ')) {
    text = text.slice(0, -1)
    map.pop()
  }
  return { text, map }
}

interface ColumnMatch {
  col: Column
  alias: string
}

const ALIASES = COLUMNS.flatMap(col => col.aliases.map(alias => ({ col, alias, n: normalize(alias) })))
const SECTION_TITLES = SECTIONS.map(section => ({
  section,
  n: normalize(section.title).replace(/^(?:i|ii|iii|iv|v|vi)\s+/, ''),
}))

function matchColumn(line: string): ColumnMatch | null {
  const n = normalize(stripLead(line))
  if (!n) return null
  let best: (typeof ALIASES)[number] | null = null
  for (const a of ALIASES) {
    if ((n === a.n || n.startsWith(`${a.n} `)) && (!best || a.n.length > best.n.length)) best = a
  }
  return best && { col: best.col, alias: best.alias }
}

const findColumn = (line: string): Column | null => matchColumn(line)?.col ?? null

function afterLabel(text: string, col: Column, alias: string): string | null {
  const { text: n, map } = normalizeWithMap(text)
  const header = col.header.replace(/^\s*\d{1,2}[.)]\s*/, '')
  let end = -1
  for (const candidate of [header, alias]) {
    const label = normalize(candidate)
    if (!label) continue
    const at = n.indexOf(label)
    if (at >= 0) end = Math.max(end, at + label.length - 1)
  }
  if (end < 0 || end >= map.length) return null
  return text
    .slice(map[end] + 1)
    .replace(/^[\s:;,.?!•▪●○☐☑✓✔\]\)\-–—]+/, '')
    .trim()
}

const valueAfterLabel = (line: string, col: Column, alias: string) => afterLabel(line, col, alias) ?? ''

function findSection(line: string): Section | null {
  const n = normalize(stripLead(line))
  if (!n || n.length > 120) return null
  return SECTION_TITLES.find(t => n.includes(t.n))?.section ?? null
}

export function isRatingMark(line: string): boolean {
  const s = stripLead(line).trim()
  return (
    /^\(?[1-5]\)?(?:\.0)?\s*(?:\/\s*5)?$/i.test(s) ||
    /^(?:rating|score)\s*:?\s*[1-5](?:\.0)?\s*(?:\/\s*5)?$/i.test(s) ||
    /^[1-5](?:\.0)?\s*[-–—:]\s*(?:excellent|very satisfactory|satisfactory|fair|poor|strongly agree|agree|neutral|disagree|strongly disagree)$/i.test(
      s,
    )
  )
}

export function extractRating(line: string): string | null {
  const s = stripLead(line).trim()
  if (!s) return null
  if (isRatingMark(s)) {
    const n = s.match(/[1-5]/)
    if (n) return n[0]
  }
  const word = s.toLowerCase().match(/^(?:excellent|very satisfactory|satisfactory|fair|poor|strongly agree|agree|neutral|disagree|strongly disagree)\b/)
  if (word) return WORD_RATINGS[word[0]] ?? null
  const marks = [...s.matchAll(/(?<![\d.])([1-5])(?:\.0)?(?![\d])/g)]
  if (!marks.length) return null
  return marks[marks.length - 1][1]
}

const afterColon = (line: string): string => {
  const i = line.indexOf(':')
  return i >= 0 ? line.slice(i + 1).trim() : ''
}

const clean = (s: string) =>
  s
    .replace(/^[\s:;,.•▪●○☐☑✓✔\-–—]+/, '')
    .replace(/\s+/g, ' ')
    .trim()

const isBoundary = (line: string) =>
  !line.trim() || isNoise(line) || findColumn(line) !== null || findSection(line) !== null

function nextLine(lines: string[], from: number): { index: number; value: string } | null {
  for (let j = from; j < lines.length; j++) {
    const raw = lines[j].trim()
    if (!raw) continue
    if (isNoise(raw)) continue
    if (findColumn(raw) || findSection(raw)) return null
    return { index: j, value: raw }
  }
  return null
}

function collectAnswer(
  lines: string[],
  start: number,
  col: Column,
  alias: string,
): { value: string; next: number } {
  const parts = [lines[start]]
  let j = start + 1
  for (; j < lines.length && parts.length < 19; j++) {
    const raw = lines[j].trim()
    if (!raw) {
      if (parts.length) parts.push('')
      continue
    }
    if (isBoundary(raw)) break
    parts.push(raw)
  }
  while (parts.length && parts[parts.length - 1] === '') parts.pop()

  const block = parts.join('\n')
  return { value: afterLabel(block, col, alias) ?? clean(block), next: j }
}

function baseValues(): Record<string, string> {
  return Object.fromEntries(COLUMNS.map(c => [c.id, '']))
}

function parseBlock(rawLines: string[]): ParsedRow {
  const lines = rawLines.map(l => l.replace(/\u00a0/g, ' ').trim())
  const values = baseValues()
  const low: Record<string, Confidence> = {}

  let currentSection: Section | null = null
  let pointer = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!line || isNoise(line)) continue

    const section = findSection(line)
    if (section) {
      currentSection = section
      pointer = 0
    }

    const match = matchColumn(line)
    const col = match?.col
    if (!col) {
      if (currentSection && isRatingMark(line)) {
        const id = currentSection.ids[pointer]
        if (id && values[id] === '') {
          values[id] = extractRating(line) ?? ''
          low[id] = 'guess'
          pointer += 1
        }
      }
      continue
    }

    if (col.type === 'consent') {
      const inline = clean(afterColon(line))
      if (/^(?:i\s+)?agree$/i.test(inline)) {
        values.consent = 'AGREE'
        continue
      }
      const near = nextLine(lines, i + 1)
      if (near && /^(?:i\s+)?agree$/i.test(near.value)) {
        values.consent = 'AGREE'
        i = near.index
      }
      continue
    }

    if (col.type === 'rating') {
      if (currentSection?.ids.includes(col.id)) {
        pointer = Math.max(pointer, currentSection.ids.indexOf(col.id) + 1)
      }
      const inline = extractRating(valueAfterLabel(line, col, match.alias) || afterColon(line))
      if (inline) {
        values[col.id] = inline
        continue
      }
      const near = nextLine(lines, i + 1)
      if (near && (isRatingMark(near.value) || !/\d/.test(near.value))) {
        const mark = extractRating(near.value)
        if (mark) {
          values[col.id] = mark
          i = near.index
          continue
        }
      }
      continue
    }

    if (col.type === 'longtext') {
      const answer = collectAnswer(lines, i, col, match.alias)
      if (answer.value) values[col.id] = answer.value
      i = answer.next - 1
      continue
    }

    const inline = clean(
      (valueAfterLabel(line, col, match.alias) || afterColon(line)).replace(
        /^\(choose all that apply\)\s*:?\s*/i,
        '',
      ),
    )
    if (inline) {
      values[col.id] = inline
      continue
    }
    const near = nextLine(lines, i + 1)
    if (near) {
      values[col.id] = clean(near.value)
      i = near.index
    }
  }

  const signature = normalize(values.name)
  if (signature) {
    for (const id of ['question8', 'otherComments']) {
      values[id] = values[id]
        .split('\n')
        .filter(line => normalize(line) !== signature)
        .join('\n')
        .trim()
    }
  }

  if (!values.email) {
    const email = rawLines.join(' ').match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)
    if (email) values.email = email[0]
  }
  if (!values.consent) {
    const agree = rawLines.find(l => /^(?:i\s+)?agree$/i.test(l.trim()))
    if (agree) values.consent = 'AGREE'
  }

  return { values, low }
}

export function nameFromFilename(fileName: string): string {
  const cleaned = fileName
    .replace(/\.[a-z0-9]+$/i, '')
    .replace(/\b(?:evaluation|form|training|response|responses|participant|participants|course|resource|person|sheet|copy|final|signed|scan|intake|feedback|seminar|for|of|the|and)\b/gi, ' ')
    .replace(/[_\-.]+/g, ' ')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\d+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (cleaned.length < 3 || !/[a-z]/i.test(cleaned)) return ''
  return cleaned.replace(/\b\w/g, c => c.toUpperCase())
}

function splitBlocks(lines: string[]): string[][] {
  const starts: number[] = []
  lines.forEach((line, i) => {
    if (findColumn(line)?.id === 'name') starts.push(i)
  })
  if (starts.length <= 1) return [lines]
  return starts.map((start, i) => lines.slice(start, starts[i + 1] ?? lines.length))
}

export function parseResponseText(text: string, sourceName = ''): ParsedRow[] {
  const normalized = text.replace(/\r\n?/g, '\n').replace(/\u00a0/g, ' ')
  const lines = normalized.split('\n').flatMap(line => {
    if (!line.includes('\t')) return [line]
    const cells = line
      .split('\t')
      .map(c => c.trim())
      .filter(Boolean)
    if (cells.length < 2) return [line]
    const at = cells.findIndex(c => findColumn(c))
    if (at <= 0) return [`${cells[0]}: ${cells.slice(1).join(' ')}`]
    const lead = cells.slice(0, at).filter(c => !/^\(?\d{1,2}[.)]?$/.test(c))
    const rest = cells.slice(at)
    const row = rest.length < 2 ? rest[0] : `${rest[0]}: ${rest.slice(1).join(' ')}`
    return lead.length ? [lead.join(' '), row] : [row]
  })

  const blocks = splitBlocks(lines)
  const parsed = blocks.map(block => ({ ...parseBlock(block), text: block.join('\n') }))

  const fallbackName = nameFromFilename(sourceName)
  for (const row of parsed) {
    for (const id of RATING_IDS.courseRatings.concat(RATING_IDS.resource)) {
      if (!row.values[id]) row.low[id] = 'missing'
    }
    if (!row.values.name && fallbackName) {
      row.values.name = fallbackName
      row.low.name = 'guess'
    }
    if (!row.values.name) row.low.name = 'missing'
  }
  return parsed
}

let counter = 0
export function uid(prefix = 'r'): string {
  counter += 1
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`
}

export function toRows(text: string, sourceName: string): ResponseRow[] {
  return parseResponseText(text, sourceName).map(p => ({
    id: uid(),
    source: sourceName,
    values: p.values,
    low: p.low,
  }))
}

const personKey = (row: ResponseRow) =>
  normalize(row.values.name ?? '').split(' ').filter(Boolean).sort().join(' ')

export function mergeRows(rows: ResponseRow[]): ResponseRow[] {
  const merged: ResponseRow[] = []
  const at = new Map<string, number>()
  for (const row of rows) {
    const key = personKey(row)
    const i = key ? at.get(key) : undefined
    if (i === undefined) {
      if (key) at.set(key, merged.length)
      merged.push(row)
      continue
    }
    const into = merged[i]
    const values = { ...into.values }
    const low = { ...into.low }
    for (const id of new Set([...Object.keys(row.values), ...Object.keys(row.low)])) {
      const keep = values[id] && (!row.values[id] || (row.low[id] && !low[id]))
      if (keep) continue
      if (row.values[id]) {
        values[id] = row.values[id]
        if (row.low[id]) low[id] = row.low[id]
        else delete low[id]
      } else if (row.low[id]) low[id] = row.low[id]
    }
    const sources = new Set([...into.source.split(' + '), ...row.source.split(' + ')].filter(Boolean))
    merged[i] = { ...into, source: [...sources].join(' + '), values, low }
  }
  return merged
}
