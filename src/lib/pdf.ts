import type { jsPDF } from 'jspdf'
import type { RowInput } from 'jspdf-autotable'
import { COLUMNS, GROUPS, SECTIONS, exportBase, type GroupId } from '../schema'
import type { ResponseRow } from '../types'

const ACCENT: [number, number, number] = [11, 95, 88]
const INK: [number, number, number] = [22, 26, 27]
const MUTED: [number, number, number] = [88, 97, 101]
const HAIR: [number, number, number] = [226, 231, 231]
const HEAD: [number, number, number] = [227, 243, 241]
const AVERAGE: [number, number, number] = [255, 243, 209]
const MARGIN = 32
const TITLE = 'EVALUATION FORM FOR TRAINING — RESPONSES'

const columnsFor = (group: GroupId) => COLUMNS.filter(c => c.group === group && c.id !== 'name')

const who = (row: ResponseRow, i: number) => row.values.name || `Row ${i + 1}`

const mean = (rows: ResponseRow[], id: string) => {
  const marks = rows.map(r => Number(r.values[id])).filter(n => n >= 1 && n <= 5)
  return marks.length ? (marks.reduce((a, b) => a + b, 0) / marks.length).toFixed(2) : '–'
}

const ITEM = new Map(
  SECTIONS.flatMap(s => {
    const roman = s.title.split('.')[0]
    return s.ids.map((id, i) => [id, { roman, n: i + 1, section: s }] as const)
  }),
)

function ratingTable(rows: ResponseRow[], group: 'courseRatings' | 'resource') {
  const cols = columnsFor(group)
  const sections = SECTIONS.filter(s => s.group === group)
  const head: RowInput[] = [
    [
      { content: '#', rowSpan: 2 },
      { content: 'Participant', rowSpan: 2 },
      ...sections.map(s => ({ content: s.title.split('.')[0], colSpan: s.ids.length })),
    ],
    cols.map(c => String(ITEM.get(c.id)?.n ?? '')),
  ]
  const body: RowInput[] = rows.map((row, i) => [
    String(i + 1),
    who(row, i),
    ...cols.map(c => row.values[c.id] || '–'),
  ])
  const foot: RowInput[] = [
    [{ content: 'Average', colSpan: 2 }, ...cols.map(c => mean(rows, c.id))],
  ]
  return { head, body, foot, sections }
}

function textTable(rows: ResponseRow[], group: GroupId) {
  const cols = columnsFor(group)
  const head: RowInput[] = [['#', 'Participant', ...cols.map(c => c.label)]]
  const body: RowInput[] = rows.map((row, i) => [
    String(i + 1),
    who(row, i),
    ...cols.map(c => row.values[c.id] || ''),
  ])
  return { head, body }
}

function caption(doc: jsPDF, y: number, text: string) {
  doc.setFont('times', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(...INK)
  doc.text(text.toUpperCase(), MARGIN, y)
  return y + 8
}

function legend(doc: jsPDF, y: number, group: 'courseRatings' | 'resource', frame: () => void) {
  const width = doc.internal.pageSize.getWidth() - MARGIN * 2
  const colWidth = width / 3
  const lines = SECTIONS.filter(s => s.group === group).flatMap(s => [
    { text: s.title.toUpperCase(), bold: true },
    ...s.ids.map(id => ({
      text: `${ITEM.get(id)?.n}. ${COLUMNS.find(c => c.id === id)?.label ?? id}`,
      bold: false,
    })),
  ])
  const perCol = Math.ceil(lines.length / 3)
  const pageBottom = doc.internal.pageSize.getHeight() - MARGIN - 14
  if (y + perCol * 9 + 14 > pageBottom) {
    doc.addPage()
    frame()
    y = MARGIN + 34
  }
  doc.setFontSize(7)
  doc.setTextColor(...MUTED)
  doc.setFont('helvetica', 'bold')
  doc.text('KEY', MARGIN, y + 10)
  lines.forEach((line, i) => {
    doc.setFont('helvetica', line.bold ? 'bold' : 'normal')
    doc.setTextColor(...(line.bold ? INK : MUTED))
    const col = Math.floor(i / perCol)
    const text = doc.splitTextToSize(line.text, colWidth - 10)[0] as string
    doc.text(text, MARGIN + col * colWidth, y + 22 + (i % perCol) * 9)
  })
}

export async function downloadPdf(rows: ResponseRow[], rawFilename: string) {
  const [{ jsPDF }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ])
  const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const stamp = new Date().toLocaleDateString('en-PH', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const total = '{total_pages}'

  const frame = () => {
    doc.setFont('times', 'bold')
    doc.setFontSize(12)
    doc.setTextColor(...ACCENT)
    doc.text(TITLE, MARGIN, MARGIN + 6)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(...MUTED)
    doc.text(
      `${rows.length} response${rows.length === 1 ? '' : 's'} · prepared ${stamp}`,
      pageWidth - MARGIN,
      MARGIN + 6,
      { align: 'right' },
    )
    doc.setDrawColor(...ACCENT)
    doc.setLineWidth(1.2)
    doc.line(MARGIN, MARGIN + 14, pageWidth - MARGIN, MARGIN + 14)
    doc.setFontSize(7.5)
    doc.text(
      `Page ${doc.getCurrentPageInfo().pageNumber} of ${total}`,
      pageWidth - MARGIN,
      pageHeight - MARGIN + 12,
      { align: 'right' },
    )
  }

  const base = {
    theme: 'grid' as const,
    margin: { top: MARGIN + 34, left: MARGIN, right: MARGIN, bottom: MARGIN },
    styles: {
      font: 'helvetica',
      fontSize: 7.5,
      cellPadding: 3.5,
      textColor: INK,
      lineColor: HAIR,
      lineWidth: 0.5,
      valign: 'top' as const,
      overflow: 'linebreak' as const,
    },
    headStyles: {
      fillColor: HEAD,
      textColor: ACCENT,
      fontStyle: 'bold' as const,
      lineColor: HAIR,
      valign: 'middle' as const,
    },
    footStyles: { fillColor: AVERAGE, textColor: INK, fontStyle: 'bold' as const },
    showFoot: 'lastPage' as const,
    rowPageBreak: 'avoid' as const,
    didDrawPage: frame,
  }
  const fixed = {
    0: { cellWidth: 18, halign: 'right' as const, textColor: MUTED },
    1: { cellWidth: 118, fontStyle: 'bold' as const },
  }
  const afterY = () =>
    (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY

  GROUPS.forEach((group, index) => {
    const room = index > 0 && group.id === 'other' && afterY() + 120 < pageHeight - MARGIN
    if (index > 0 && !room) doc.addPage()
    const y = caption(doc, room ? afterY() + 28 : MARGIN + 36, `${['I', 'II', 'III', 'IV', 'V'][index]}. ${group.label}`)

    if (group.id === 'courseRatings' || group.id === 'resource') {
      const { head, body, foot } = ratingTable(rows, group.id)
      autoTable(doc, {
        ...base,
        startY: y,
        head,
        body,
        foot,
        styles: { ...base.styles, halign: 'center' },
        headStyles: { ...base.headStyles, halign: 'center' },
        columnStyles: { ...fixed, 1: { ...fixed[1], halign: 'left' } },
        didParseCell: data => {
          if (data.section === 'foot' && data.column.index === 0) data.cell.styles.halign = 'left'
        },
      })
      legend(doc, afterY() + 6, group.id, frame)
    } else {
      const { head, body } = textTable(rows, group.id)
      autoTable(doc, { ...base, startY: y, head, body, columnStyles: fixed })
    }
  })

  doc.putTotalPages(total)
  doc.save(`${exportBase(rawFilename)}.pdf`)
}
