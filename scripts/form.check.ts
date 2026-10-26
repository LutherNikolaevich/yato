import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { Packer } from 'docx'
import { COLUMNS } from '../src/schema'
import { buildForm } from '../src/lib/form'
import { parseResponseText } from '../src/lib/parse'

const mammoth = createRequire(resolve('package.json'))('mammoth') as typeof import('mammoth')

const values: Record<string, string> = {
  name: 'ROSA M. LIM',
  email: 'rosa.lim@example.gov.ph',
  region: 'REGION II',
  age: '31 - 40',
  gender: 'FEMALE',
  citizenship: 'FILIPINO',
  socialCategory: 'LOCAL GOVERNMENT UNIT',
  timestamp: '2026-10-23',
  consent: 'AGREE',
  otherComments: 'THANK YOU',
}
COLUMNS.forEach((c, i) => {
  if (c.type === 'rating') values[c.id] = String((i % 5) + 1)
  if (c.group === 'courseComments') values[c.id] = `ANSWER ${c.id.toUpperCase()}\nSECOND LINE`
})

const out = process.argv[2]
if (out) writeFileSync(out, await Packer.toBuffer(buildForm()))

const { value: html } = await mammoth.convertToHtml({ buffer: await Packer.toBuffer(buildForm(values)) })
const strip = (s: string) => s.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim()
const lines: string[] = []
for (const [, table, para] of html.matchAll(/<table>(.*?)<\/table>|<p>(.*?)<\/p>/g)) {
  if (para !== undefined) {
    if (strip(para)) lines.push(strip(para))
    continue
  }
  for (const [, tr] of table.matchAll(/<tr>(.*?)<\/tr>/g)) {
    const cells = [...tr.matchAll(/<td>(.*?)<\/td>/g)].map(m => strip(m[1])).filter(Boolean)
    if (cells.length) lines.push(cells.length === 2 ? `${cells[0]}: ${cells[1]}` : cells.join('\t'))
  }
}

const parsed = parseResponseText(lines.join('\n'))
assert.equal(parsed.length, 1)
const [row] = parsed
for (const c of COLUMNS) {
  assert.equal(row.values[c.id], values[c.id], `${c.id}: ${JSON.stringify(row.values[c.id])}`)
  assert.equal(row.low[c.id], undefined, `${c.id} flagged ${row.low[c.id]}`)
}
console.log(`ok — blank form, ${COLUMNS.length} fields round-trip`)
