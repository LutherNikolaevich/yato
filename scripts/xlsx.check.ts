import assert from 'node:assert/strict'
import { readFileSync, writeFileSync } from 'node:fs'
import { CFB, read, type WorkSheet } from 'xlsx'
import { COLUMNS } from '../src/schema'
import { buildWorkbook, timestampSerial } from '../src/lib/xlsx'
import type { ResponseRow } from '../src/types'

const TARGET = 'folder/Evaluation Form for Training (Responses).xlsx'
const targetBytes = readFileSync(TARGET)
const target = read(targetBytes).Sheets['Form Responses 1']
const ref = (c: number, r: number) => `${encodeCol(c)}${r + 1}`
const encodeCol = (n: number): string => (n >= 26 ? encodeCol(Math.floor(n / 26) - 1) : '') + String.fromCharCode(65 + (n % 26))

const range = target['!ref']!.split(':')[1].match(/\d+$/)![0]
const rowCount = Number(range) - 1
const rows: ResponseRow[] = Array.from({ length: rowCount }, (_, r) => ({
  id: String(r),
  source: '',
  low: {},
  values: Object.fromEntries(
    COLUMNS.map((col, c) => {
      const cell = target[ref(c, r + 1)]
      if (!cell) return [col.id, '']
      if (col.id === 'timestamp') return [col.id, new Date(Math.round((cell.v - 25_569) * 86_400) * 1000).toISOString().replace('T', ' ').slice(0, 19)]
      return [col.id, String(cell.v)]
    }),
  ),
}))

const bytes = buildWorkbook(rows)
if (process.argv[2]) writeFileSync(process.argv[2], bytes)
const ours: WorkSheet = read(bytes).Sheets['Form Responses 1']

assert.equal(ours['!ref'], target['!ref'])
let cells = 0
for (let r = 0; r <= rowCount; r++)
  for (let c = 0; c < COLUMNS.length; c++) {
    const a = target[ref(c, r)]
    const b = ours[ref(c, r)]
    const at = `${ref(c, r)}`
    if (!a) {
      assert.equal(b, undefined, at)
      continue
    }
    assert.equal(b?.t, a.t, at)
    if (c === 0 && r > 0) assert.ok(Math.abs(b.v - a.v) < 1 / 86_400, at)
    else {
      assert.equal(b.v, a.v, at)
      assert.equal(b.w, a.w, at)
    }
    cells++
  }

const part = (buf: Uint8Array, path: string) => {
  const file = CFB.find(CFB.read(Buffer.from(buf), { type: 'buffer' }), `/${path}`)
  return Buffer.from(file.content).toString('utf8')
}
const between = (xml: string, open: string, close: string) => xml.slice(xml.indexOf(open), xml.indexOf(close) + close.length)
const t = (p: string) => part(targetBytes, p)
const o = (p: string) => part(bytes, p)
for (const tag of ['cols', 'pane', 'sheetFormatPr'])
  assert.equal(between(o('xl/worksheets/sheet1.xml'), `<${tag}`, tag === 'cols' ? '</cols>' : '/>'), between(t('xl/worksheets/sheet1.xml'), `<${tag}`, tag === 'cols' ? '</cols>' : '/>'), tag)
assert.equal(between(o('xl/tables/table1.xml'), '<table ', '</table>'), between(t('xl/tables/table1.xml'), '<table ', '</table>'), 'table')
const recolor = (xml: string) => xml.replace(/5B3F86"\/><bgColor rgb="FF5B3F86/, 'E3F3F1"/><bgColor rgb="FFE3F3F1').replaceAll('5B3F86', '0F766E')
for (const tag of ['numFmts', 'fonts', 'dxfs', 'tableStyles'])
  assert.equal(between(o('xl/styles.xml'), `<${tag}`, `</${tag}>`), recolor(between(t('xl/styles.xml'), `<${tag}`, `</${tag}>`)), tag)
const heights = [...o('xl/worksheets/sheet1.xml').matchAll(/<row [^>]*>/g)].map(m => m[0].replace(/r="\d+" /, ''))
assert.ok(heights.every(h => h === '<row ht="22.5" customHeight="1">'), 'row heights')

assert.equal(timestampSerial('2026-08-20 11:04:12.000'), timestampSerial('8/20/2026 11:04:12'))
assert.equal(timestampSerial('8/20/2026 1:04:12 PM'), timestampSerial('2026-08-20 13:04:12'))
assert.equal(timestampSerial('August 20'), null)
assert.equal(read(buildWorkbook([])).Sheets['Form Responses 1']['!ref'], 'A1:BC1')

console.log(`ok — ${rowCount} rows, ${cells} cells match the reference workbook`)
