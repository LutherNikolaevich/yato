import { CFB } from 'xlsx'
import { COLUMNS, RATING_IDS, exportBase } from '../schema'
import type { ResponseRow } from '../types'

const RATING_SET = new Set(RATING_IDS.courseRatings.concat(RATING_IDS.resource))

const NS = 'http://schemas.openxmlformats.org'
const HEAD = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'
const REL = `${NS}/officeDocument/2006/relationships`
const TYPE = 'application/vnd.openxmlformats-officedocument'

const WIDTHS: [number, number, string][] = [
  [1, 2, '18.88'], [3, 3, '37.63'], [4, 4, '21.63'], [5, 8, '18.88'], [9, 9, '33.75'],
  [10, 34, '37.63'], [35, 35, '31.0'], [36, 54, '37.63'], [55, 55, '20.0'], [56, 61, '18.88'],
]

const STYLES = `${HEAD}<styleSheet xmlns="${NS}/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="m/d/yyyy h:mm:ss"/></numFmts><fonts count="2"><font><sz val="10.0"/><color rgb="FF000000"/><name val="Arial"/><scheme val="minor"/></font><font><color theme="1"/><name val="Arial"/><scheme val="minor"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="lightGray"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf borderId="0" fillId="0" fontId="0" numFmtId="0" applyAlignment="1" applyFont="1"/></cellStyleXfs><cellXfs count="4"><xf borderId="0" fillId="0" fontId="0" numFmtId="0" xfId="0" applyAlignment="1" applyFont="1"><alignment readingOrder="0" shrinkToFit="0" vertical="bottom" wrapText="0"/></xf><xf borderId="0" fillId="0" fontId="1" numFmtId="0" xfId="0" applyAlignment="1" applyFont="1"><alignment horizontal="left" readingOrder="0" shrinkToFit="0" vertical="center" wrapText="0"/></xf><xf borderId="0" fillId="0" fontId="1" numFmtId="164" xfId="0" applyAlignment="1" applyFont="1" applyNumberFormat="1"><alignment readingOrder="0" shrinkToFit="0" vertical="center" wrapText="0"/></xf><xf borderId="0" fillId="0" fontId="1" numFmtId="0" xfId="0" applyAlignment="1" applyFont="1"><alignment readingOrder="0" shrinkToFit="0" vertical="center" wrapText="0"/></xf></cellXfs><cellStyles count="1"><cellStyle xfId="0" name="Normal" builtinId="0"/></cellStyles><dxfs count="5"><dxf><font/><fill><patternFill patternType="none"/></fill><border/></dxf><dxf><font/><fill><patternFill patternType="solid"><fgColor rgb="FFE3F3F1"/><bgColor rgb="FFE3F3F1"/></patternFill></fill><border/></dxf><dxf><font/><fill><patternFill patternType="solid"><fgColor rgb="FFFFFFFF"/><bgColor rgb="FFFFFFFF"/></patternFill></fill><border/></dxf><dxf><font/><fill><patternFill patternType="solid"><fgColor rgb="FFF8F9FA"/><bgColor rgb="FFF8F9FA"/></patternFill></fill><border/></dxf><dxf><border><left style="thin"><color rgb="FF0F766E"/></left><right style="thin"><color rgb="FF0F766E"/></right><top style="thin"><color rgb="FF0F766E"/></top><bottom style="thin"><color rgb="FF0F766E"/></bottom></border></dxf></dxfs><tableStyles count="1"><tableStyle count="4" pivot="0" name="Form Responses 1-style"><tableStyleElement dxfId="1" type="headerRow"/><tableStyleElement dxfId="2" type="firstRowStripe"/><tableStyleElement dxfId="3" type="secondRowStripe"/><tableStyleElement dxfId="4" size="0" type="wholeTable"/></tableStyle></tableStyles></styleSheet>`

const THEME = `${HEAD}<a:theme xmlns:a="${NS}/drawingml/2006/main" xmlns:r="${REL}" name="Sheets"><a:themeElements><a:clrScheme name="Sheets"><a:dk1><a:srgbClr val="000000"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="000000"/></a:dk2><a:lt2><a:srgbClr val="FFFFFF"/></a:lt2><a:accent1><a:srgbClr val="4285F4"/></a:accent1><a:accent2><a:srgbClr val="EA4335"/></a:accent2><a:accent3><a:srgbClr val="FBBC04"/></a:accent3><a:accent4><a:srgbClr val="34A853"/></a:accent4><a:accent5><a:srgbClr val="FF6D01"/></a:accent5><a:accent6><a:srgbClr val="46BDC6"/></a:accent6><a:hlink><a:srgbClr val="1155CC"/></a:hlink><a:folHlink><a:srgbClr val="1155CC"/></a:folHlink></a:clrScheme><a:fontScheme name="Sheets"><a:majorFont><a:latin typeface="Arial"/><a:ea typeface="Arial"/><a:cs typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Arial"/><a:ea typeface="Arial"/><a:cs typeface="Arial"/></a:minorFont></a:fontScheme><a:fmtScheme name="Office"><a:fillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln><a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`

const STATIC: Record<string, string> = {
  '[Content_Types].xml': `${HEAD}<Types xmlns="${NS}/package/2006/content-types"><Default ContentType="application/xml" Extension="xml"/><Default ContentType="application/vnd.openxmlformats-package.relationships+xml" Extension="rels"/><Override ContentType="${TYPE}.spreadsheetml.table+xml" PartName="/xl/tables/table1.xml"/><Override ContentType="${TYPE}.spreadsheetml.worksheet+xml" PartName="/xl/worksheets/sheet1.xml"/><Override ContentType="${TYPE}.spreadsheetml.sharedStrings+xml" PartName="/xl/sharedStrings.xml"/><Override ContentType="${TYPE}.spreadsheetml.styles+xml" PartName="/xl/styles.xml"/><Override ContentType="${TYPE}.theme+xml" PartName="/xl/theme/theme1.xml"/><Override ContentType="${TYPE}.spreadsheetml.sheet.main+xml" PartName="/xl/workbook.xml"/></Types>`,
  '_rels/.rels': `${HEAD}<Relationships xmlns="${NS}/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
  'xl/workbook.xml': `${HEAD}<workbook xmlns="${NS}/spreadsheetml/2006/main" xmlns:r="${REL}"><workbookPr/><sheets><sheet state="visible" name="Form Responses 1" sheetId="1" r:id="rId4"/></sheets><definedNames/><calcPr/></workbook>`,
  'xl/_rels/workbook.xml.rels': `${HEAD}<Relationships xmlns="${NS}/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/theme" Target="theme/theme1.xml"/><Relationship Id="rId2" Type="${REL}/styles" Target="styles.xml"/><Relationship Id="rId3" Type="${REL}/sharedStrings" Target="sharedStrings.xml"/><Relationship Id="rId4" Type="${REL}/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`,
  'xl/worksheets/_rels/sheet1.xml.rels': `${HEAD}<Relationships xmlns="${NS}/package/2006/relationships"><Relationship Id="rId1" Type="${REL}/table" Target="../tables/table1.xml"/></Relationships>`,
  'xl/styles.xml': STYLES,
  'xl/theme/theme1.xml': THEME,
}

const esc = (s: string) =>
  s.replace(/[\x00-\x08\x0b\x0c\x0e-\x1f\ufffe\uffff]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function colName(n: number): string {
  let s = ''
  for (n += 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s
  return s
}

export function timestampSerial(raw: string): number | null {
  const v = raw.trim()
  let y: number, mo: number, d: number
  let rest: string
  const us = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(.*)$/.exec(v)
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(.*)$/.exec(v)
  if (us) [mo, d, y, rest] = [+us[1], +us[2], +us[3], us[4]]
  else if (iso) [y, mo, d, rest] = [+iso[1], +iso[2], +iso[3], iso[4]]
  else return null
  const t = /^(?:[ T]+(\d{1,2}):(\d{2})(?::(\d{2})(?:\.\d+)?)?\s*([ap]\.?m\.?)?)?\s*$/i.exec(rest)
  if (!t || mo < 1 || mo > 12 || d < 1 || d > 31) return null
  let h = t[1] ? +t[1] : 0
  const pm = t[4]?.[0].toLowerCase()
  if (pm) h = (h % 12) + (pm === 'p' ? 12 : 0)
  const ms = Date.UTC(y, mo - 1, d, h, t[2] ? +t[2] : 0, t[3] ? +t[3] : 0)
  return ms / 86_400_000 + 25_569
}

export function buildWorkbook(rows: ResponseRow[]): Uint8Array<ArrayBuffer> {
  const strings: string[] = []
  const index = new Map<string, number>()
  let count = 0
  const str = (s: string) => {
    count++
    let i = index.get(s)
    if (i === undefined) index.set(s, (i = strings.push(s) - 1))
    return i
  }

  const cells = (r: number, values: string[], header: boolean) =>
    values
      .map((value, c) => {
        const ref = `${colName(c)}${r}`
        if (header) return `<c r="${ref}" s="1" t="s"><v>${str(value)}</v></c>`
        if (!value) return ''
        const id = COLUMNS[c].id
        const serial = id === 'timestamp' ? timestampSerial(value) : null
        if (serial !== null) return `<c r="${ref}" s="2"><v>${serial}</v></c>`
        if (RATING_SET.has(id) && /^[1-5]$/.test(value)) return `<c r="${ref}" s="3"><v>${value}</v></c>`
        return `<c r="${ref}" s="3" t="s"><v>${str(value)}</v></c>`
      })
      .join('')

  const headers = COLUMNS.map(c => c.header)
  const sheetRows = [headers, ...rows.map(row => COLUMNS.map(col => row.values[col.id] ?? ''))]
    .map((values, i) => `<row r="${i + 1}" ht="22.5" customHeight="1">${cells(i + 1, values, i === 0)}</row>`)
    .join('')
  const cols = WIDTHS.map(([min, max, w]) => `<col customWidth="1" min="${min}" max="${max}" width="${w}"/>`).join('')
  const last = colName(COLUMNS.length - 1)
  const ref = `A1:${last}${Math.max(rows.length + 1, 2)}`

  const sheet = `${HEAD}<worksheet xmlns="${NS}/spreadsheetml/2006/main" xmlns:r="${REL}"><sheetPr><outlinePr summaryBelow="0" summaryRight="0"/></sheetPr><sheetViews><sheetView workbookViewId="0"><pane ySplit="1.0" topLeftCell="A2" activePane="bottomLeft" state="frozen"/><selection activeCell="A2" sqref="A2" pane="bottomLeft"/></sheetView></sheetViews><sheetFormatPr customHeight="1" defaultColWidth="12.63" defaultRowHeight="15.75"/><cols>${cols}</cols><sheetData>${sheetRows}</sheetData><tableParts count="1"><tablePart r:id="rId1"/></tableParts></worksheet>`
  const tableCols = headers
    .map((h, i) => `<tableColumn name="${esc(h).replace(/\n/g, '_x000a_')}" id="${i + 1}"/>`)
    .join('')
  const table = `${HEAD}<table xmlns="${NS}/spreadsheetml/2006/main" ref="${ref}" displayName="Form_Responses" name="Form_Responses" id="1"><tableColumns count="${headers.length}">${tableCols}</tableColumns><tableStyleInfo name="Form Responses 1-style" showColumnStripes="0" showFirstColumn="1" showLastColumn="1" showRowStripes="1"/></table>`
  const sst = `${HEAD}<sst xmlns="${NS}/spreadsheetml/2006/main" count="${count}" uniqueCount="${strings.length}">${strings
    .map(s => `<si><t${/^\s|\s$|\n/.test(s) ? ' xml:space="preserve"' : ''}>${esc(s)}</t></si>`)
    .join('')}</sst>`

  const parts: Record<string, string> = {
    ...STATIC,
    'xl/worksheets/sheet1.xml': sheet,
    'xl/tables/table1.xml': table,
    'xl/sharedStrings.xml': sst,
  }
  const encoder = new TextEncoder()
  const zip = CFB.utils.cfb_new()
  for (const [path, xml] of Object.entries(parts)) CFB.utils.cfb_add(zip, path, encoder.encode(xml))
  return new Uint8Array(CFB.write(zip, { fileType: 'zip', type: 'array', compression: true }))
}

export function downloadWorkbook(rows: ResponseRow[], rawFilename: string) {
  const blob = new Blob([buildWorkbook(rows)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })
  const url = URL.createObjectURL(blob)
  const a = Object.assign(document.createElement('a'), { href: url, download: `${exportBase(rawFilename)}.xlsx` })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
