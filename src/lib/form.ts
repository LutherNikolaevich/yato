import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableLayoutType,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'
import { COLUMNS, COLUMN_BY_ID, SECTIONS, type Column } from '../schema'

export const BLANK_FILENAME = 'Evaluation Form for Training (Blank).docx'

const PAGE = { width: 11906, height: 16838 }
const MARGIN = 1080
const TEXT_W = PAGE.width - 2 * MARGIN
const MARK_W = 1300
const RULE = { style: BorderStyle.SINGLE, size: 6, color: '808080' }
const NONE = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' }
const SCALE = 'Scale:  5 Excellent   4 Very satisfactory   3 Satisfactory   2 Fair   1 Poor'

const col = (id: string) => COLUMN_BY_ID.get(id) as Column
const tidy = (s: string) => s.replace(/\s+\./g, '.').replace(/\s+/g, ' ').trim()
const itemText = (c: Column) => tidy(c.header.match(/\[\s*\d+\.\s*(.*)\]$/)?.[1] ?? c.header)
const headingText = (c: Column) => tidy(c.header.split('[')[0])

const text = (s: string, bold = false) => new TextRun({ text: s, bold })
const heading = (s: string) =>
  new Paragraph({
    spacing: { before: 320, after: 120 },
    children: [new TextRun({ text: s.toUpperCase(), bold: true, font: 'Times New Roman', size: 26 })],
  })
const note = (s: string) => new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: s, size: 19 })] })

const row = (label: Paragraph, value: string, labelW: number) =>
  new TableRow({
    cantSplit: true,
    children: [
      new TableCell({ width: { size: labelW, type: WidthType.DXA }, children: [label] }),
      new TableCell({
        width: { size: TEXT_W - labelW, type: WidthType.DXA },
        children: [new Paragraph({ alignment: labelW > TEXT_W / 2 ? AlignmentType.CENTER : undefined, children: [text(value)] })],
      }),
    ],
  })

const table = (labelW: number, rows: TableRow[]) =>
  new Table({
    width: { size: TEXT_W, type: WidthType.DXA },
    columnWidths: [labelW, TEXT_W - labelW],
    layout: TableLayoutType.FIXED,
    borders: { top: RULE, bottom: RULE, left: RULE, right: RULE, insideHorizontal: RULE, insideVertical: RULE },
    margins: { top: 80, bottom: 80, left: 100, right: 100 },
    rows,
  })

export function buildForm(values: Record<string, string> = {}) {
  const v = (id: string) => values[id] ?? ''
  const field = (id: string, label: string) => row(new Paragraph({ children: [text(label, true)] }), v(id), 4200)
  const rating = (c: Column, label: string, lead: string) =>
    row(new Paragraph({ children: [text(`${lead} `, true), text(label)] }), v(c.id), TEXT_W - MARK_W)

  const ratingSections = (group: 'courseRatings' | 'resource') =>
    SECTIONS.filter(s => s.group === group).flatMap(section => {
      const first = col(section.ids[0])
      if (section.ids.length === 1 && !first.header.includes('[')) {
        const lead = first.header.split('.')[0] + '.'
        return [table(TEXT_W - MARK_W, [rating(first, tidy(first.header).replace(/^[IVX]+\.\s*/, ''), lead)])]
      }
      return [
        new Paragraph({ spacing: { before: 200, after: 80 }, keepNext: true, children: [text(headingText(first), true)] }),
        table(
          TEXT_W - MARK_W,
          section.ids.map((id, i) => rating(col(id), itemText(col(id)), `${i + 1}.`)),
        ),
      ]
    })

  const answer = (c: Column, lines: number) => {
    const written = v(c.id).split('\n').filter(Boolean)
    return [
      new Paragraph({ spacing: { before: 200 }, keepNext: true, children: [text(tidy(c.header), true)] }),
      ...Array.from({ length: Math.max(lines, written.length) }, (_, i) =>
        new Paragraph({
          spacing: { before: 160 },
          border: { bottom: RULE, top: NONE },
          children: [text(written[i] ?? '')],
        }),
      ),
    ]
  }

  return new Document({
    creator: 'Evaluation intake',
    title: 'Evaluation Form for Training',
    styles: { default: { document: { run: { font: 'Arial', size: 21 } } } },
    sections: [
      {
        properties: { page: { size: PAGE, margin: { top: MARGIN, bottom: MARGIN, left: MARGIN, right: MARGIN } } },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ size: 17, children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES] })],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'EVALUATION FORM FOR TRAINING', bold: true, font: 'Times New Roman', size: 30 })],
          }),
          note(
            'Type your answers in the empty cells, or print and write in block capitals. For ratings enter one number, 1 to 5, beside each item.',
          ),

          heading('Participant information'),
          table(4200, [
            field('name', 'PARTICIPANTS NAME:'),
            field('email', 'Email Address:'),
            field('region', 'REGION:'),
            field('age', 'AGE:'),
            field('gender', 'GENDER:'),
            field('citizenship', 'CITIZENSHIP:'),
            field('socialCategory', 'Social Category (choose all that apply):'),
            field('timestamp', 'Date submitted:'),
          ]),
          new Paragraph({ spacing: { before: 200, after: 120 }, children: [new TextRun({
            text: 'Your answers are kept in strict confidence under Section 2 of the Data Privacy Act of 2012 and used solely for records keeping. Falsified information bars you from future courses.',
            size: 18,
          })] }),
          table(4200, [field('consent', 'Data privacy consent (write I AGREE):')]),

          heading('Course evaluation'),
          note(SCALE),
          ...ratingSections('courseRatings'),

          heading('Comments'),
          ...COLUMNS.filter(c => c.group === 'courseComments').flatMap(c => answer(c, c.id === 'question7' ? 3 : 2)),

          heading('Resource person evaluation'),
          note(SCALE),
          ...ratingSections('resource'),

          ...answer(col('otherComments'), 3),
        ],
      },
    ],
  })
}

export async function downloadBlankForm() {
  const url = URL.createObjectURL(await Packer.toBlob(buildForm()))
  const a = Object.assign(document.createElement('a'), { href: url, download: BLANK_FILENAME })
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
