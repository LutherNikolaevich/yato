import { GlobalWorkerOptions, getDocument, type PDFPageProxy } from 'pdfjs-dist'
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import * as mammoth from 'mammoth'
import { cleanScan, wordsToText } from './ocr'

GlobalWorkerOptions.workerSrc = workerUrl

export type Progress = (detail: string, status: 'reading' | 'ocr') => void

export interface ExtractResult {
  text: string
  pages: number
  ocr: boolean
}

interface Piece {
  str: string
  x: number
  y: number
  width: number
}

const lineFromPieces = (pieces: Piece[]): string => {
  pieces.sort((a, b) => a.x - b.x)
  let line = ''
  let previous: Piece | null = null
  for (const piece of pieces) {
    if (!piece.str.trim()) continue
    if (previous) {
      const gap = piece.x - (previous.x + previous.width)
      if (gap > 1.2 && !/\s$/.test(line) && !/^\s/.test(piece.str)) line += ' '
    }
    line += piece.str
    previous = piece
  }
  return line.replace(/\s+/g, ' ').trim()
}

function pageLines(items: Array<{ str?: string; transform?: number[]; width?: number }>): string {
  const pieces: Piece[] = []
  for (const item of items) {
    if (typeof item.str !== 'string' || !item.str.trim()) continue
    const t = item.transform
    if (!t) continue
    pieces.push({ str: item.str, x: t[4], y: t[5], width: item.width ?? 0 })
  }
  pieces.sort((a, b) => b.y - a.y || a.x - b.x)

  const rows: Piece[][] = []
  for (const piece of pieces) {
    const row = rows.find(r => Math.abs(r[0].y - piece.y) <= 4)
    if (row) row.push(piece)
    else rows.push([piece])
  }
  return rows.map(lineFromPieces).filter(Boolean).join('\n')
}

type OcrWorker = Awaited<ReturnType<typeof import('tesseract.js')['createWorker']>>

async function ocrWorker(onProgress?: Progress): Promise<OcrWorker> {
  const { createWorker, PSM } = await import('tesseract.js')
  const worker = await createWorker('eng', 1, {
    logger: m => {
      if (m.status === 'recognizing text')
        onProgress?.(`Reading scanned page… ${Math.round(m.progress * 100)}%`, 'ocr')
    },
  }).catch(() => {
    throw new Error('Couldn’t read the scanned pages. Scans need an internet connection; check it and try again.')
  })
  await worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_COLUMN, preserve_interword_spaces: '1' })
  return worker
}

async function ocrPage(page: PDFPageProxy, worker: OcrWorker, onProgress?: Progress): Promise<string> {
  onProgress?.('Preparing scanned page…', 'ocr')
  const scale = Math.min(3, 2400 / page.getViewport({ scale: 1 }).width)
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.ceil(viewport.width)
  canvas.height = Math.ceil(viewport.height)
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('This browser can’t read scanned pages. Try Chrome, Edge or Firefox.')
  context.fillStyle = '#fff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  await page.render({ canvasContext: context, viewport }).promise

  const image = context.getImageData(0, 0, canvas.width, canvas.height)
  cleanScan(image.data, image.width, image.height)
  context.putImageData(image, 0, 0)

  await worker.setParameters({ user_defined_dpi: String(Math.round(72 * scale)) })
  const { data } = await worker.recognize(canvas)
  return wordsToText(data.words)
}

async function readPdf(file: File, onProgress?: Progress): Promise<ExtractResult> {
  const data = new Uint8Array(await file.arrayBuffer())
  const pdf = await getDocument({ data }).promise.catch(error => {
    if (error?.name === 'PasswordException') throw new Error('This PDF is password-protected. Remove the password and try again.')
    throw error
  })
  const total = pdf.numPages
  const pages: string[] = []
  let usedOcr = false
  let worker: Promise<OcrWorker> | null = null
  try {
    for (let n = 1; n <= total; n++) {
      onProgress?.(`Page ${n} of ${total}…`, 'reading')
      const page = await pdf.getPage(n)
      try {
        const content = await page.getTextContent()
        const text = pageLines(content.items as Array<{ str?: string; transform?: number[]; width?: number }>)
        if (text.replace(/\s/g, '').length >= 24) {
          pages.push(text)
        } else {
          usedOcr = true
          worker ??= ocrWorker(onProgress)
          pages.push(await ocrPage(page, await worker, onProgress))
        }
      } finally {
        page.cleanup()
      }
    }
  } finally {
    if (worker) await (await worker.catch(() => null))?.terminate()
    await pdf.destroy()
  }
  return { text: pages.join('\n\n'), pages: total, ocr: usedOcr }
}

function htmlToLines(html: string): string[] {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const lines: string[] = []

  const visit = (node: Element) => {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName.toLowerCase()
      if (tag === 'table') {
        for (const tr of Array.from(child.querySelectorAll('tr'))) {
          const cells = Array.from(tr.querySelectorAll(':scope > th, :scope > td'))
            .map(c => (c.textContent ?? '').replace(/\s+/g, ' ').trim())
            .filter(Boolean)
          if (!cells.length) continue
          if (cells.length === 2) lines.push(`${cells[0]}: ${cells[1]}`)
          else lines.push(cells.join('\t'))
        }
        continue
      }
      if (/^(p|h[1-6]|li|blockquote|pre|figcaption)$/.test(tag)) {
        const text = (child.textContent ?? '').replace(/\s+/g, ' ').trim()
        if (text) lines.push(text)
        continue
      }
      visit(child)
    }
  }

  visit(doc.body)
  return lines
}

async function readDocx(file: File): Promise<ExtractResult> {
  const { value } = await mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() })
  const lines = htmlToLines(value)
  if (!lines.length) throw new Error('This Word file has no text to read.')
  return { text: lines.join('\n'), pages: 1, ocr: false }
}

const extension = (name: string) => name.toLowerCase().split('.').pop() ?? ''

export async function extractDocument(file: File, onProgress?: Progress): Promise<ExtractResult> {
  const ext = extension(file.name)
  if (ext === 'pdf') return readPdf(file, onProgress)
  if (ext === 'docx') return readDocx(file)
  throw new Error('Only PDF and Word (.docx) files can be read.')
}
