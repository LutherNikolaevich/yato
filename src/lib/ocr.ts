export interface OcrWord {
  text: string
  bbox: { x0: number; y0: number; x1: number; y1: number }
}

export function cleanScan(px: Uint8ClampedArray | Uint8Array, width: number, height: number): void {
  const size = width * height
  const gray = new Uint8Array(size)
  const hist = new Array<number>(256).fill(0)
  for (let i = 0; i < size; i++) {
    const v = (px[i * 4] * 299 + px[i * 4 + 1] * 587 + px[i * 4 + 2] * 114) / 1000 | 0
    gray[i] = v
    hist[v]++
  }

  let total = 0
  for (let t = 0; t < 256; t++) total += t * hist[t]
  let sumBack = 0
  let weightBack = 0
  let best = 0
  let threshold = 128
  for (let t = 0; t < 256; t++) {
    weightBack += hist[t]
    const weightFore = size - weightBack
    if (!weightBack) continue
    if (!weightFore) break
    sumBack += t * hist[t]
    const between = weightBack * weightFore * (sumBack / weightBack - (total - sumBack) / weightFore) ** 2
    if (between > best) {
      best = between
      threshold = t
    }
  }

  const ink = new Uint8Array(size)
  for (let i = 0; i < size; i++) ink[i] = gray[i] <= threshold ? 1 : 0

  const rule = new Uint8Array(size)
  const minRow = Math.round(width * 0.06)
  const minCol = Math.round(height * 0.025)
  for (let y = 0; y < height; y++) {
    let run = 0
    for (let x = 0; x <= width; x++) {
      if (x < width && ink[y * width + x]) run++
      else {
        if (run >= minRow) for (let k = x - run; k < x; k++) rule[y * width + k] = 1
        run = 0
      }
    }
  }
  for (let x = 0; x < width; x++) {
    let run = 0
    for (let y = 0; y <= height; y++) {
      if (y < height && ink[y * width + x]) run++
      else {
        if (run >= minCol) for (let k = y - run; k < y; k++) rule[k * width + x] = 1
        run = 0
      }
    }
  }

  for (let i = 0; i < size; i++) {
    const v = ink[i] && !rule[i] ? 0 : 255
    px[i * 4] = px[i * 4 + 1] = px[i * 4 + 2] = v
    px[i * 4 + 3] = 255
  }
}

export function wordsToText(words: OcrWord[]): string {
  const rows: Array<{ cy: number; h: number; words: OcrWord[] }> = []
  const sorted = words
    .filter(w => w.text.trim())
    .sort((a, b) => a.bbox.y0 + a.bbox.y1 - (b.bbox.y0 + b.bbox.y1))
  for (const word of sorted) {
    const h = word.bbox.y1 - word.bbox.y0
    const cy = (word.bbox.y0 + word.bbox.y1) / 2
    const row = rows.find(r => Math.abs(r.cy - cy) <= Math.max(h, r.h) / 2)
    if (row) {
      row.words.push(word)
      row.cy += (cy - row.cy) / row.words.length
      row.h = Math.max(row.h, h)
    } else rows.push({ cy, h, words: [word] })
  }
  return rows
    .sort((a, b) => a.cy - b.cy)
    .map(row => {
      row.words.sort((a, b) => a.bbox.x0 - b.bbox.x0)
      return row.words
        .map((w, i) => (i && w.bbox.x0 - row.words[i - 1].bbox.x1 > row.h * 1.5 ? '\t' : i ? ' ' : '') + w.text.trim())
        .join('')
    })
    .join('\n')
}
