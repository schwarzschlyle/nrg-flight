function pad10(n: number) {
  return n.toString().padStart(10, '0')
}

function sanitizeAscii(input: string) {
  return input.replace(/[^\x20-\x7E]/g, '?')
}

function escapePdfText(input: string) {
  const safe = sanitizeAscii(input)
  return safe.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)')
}

type PdfColorHex = `#${string}`

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n))
}

function hexToRgb01(hex: string) {
  const raw = hex.replace('#', '').trim()
  const value = raw.length === 3 ? raw.split('').map((c) => c + c).join('') : raw
  if (value.length !== 6) return { r: 0, g: 0, b: 0 }

  const r = Number.parseInt(value.slice(0, 2), 16) / 255
  const g = Number.parseInt(value.slice(2, 4), 16) / 255
  const b = Number.parseInt(value.slice(4, 6), 16) / 255
  return { r: clamp01(r), g: clamp01(g), b: clamp01(b) }
}

function rgbStr(hex: string) {
  const { r, g, b } = hexToRgb01(hex)
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)}`
}

function fill(hex: string) {
  return `${rgbStr(hex)} rg`
}

function stroke(hex: string) {
  return `${rgbStr(hex)} RG`
}

function rectFillStroke(x: number, y: number, w: number, h: number, opts: { fill: string; stroke: string; lineWidth?: number }) {
  const lw = opts.lineWidth ?? 1
  return [
    `${lw} w`,
    stroke(opts.stroke),
    fill(opts.fill),
    `${x} ${y} ${w} ${h} re`,
    'B',
  ]
}

function rectFill(x: number, y: number, w: number, h: number, hex: string) {
  return [fill(hex), `${x} ${y} ${w} ${h} re`, 'f']
}

type PdfFont = 'regular' | 'bold'

function textAt(
  text: string,
  x: number,
  y: number,
  opts?: { font?: PdfFont; size?: number; color?: string },
) {
  const fontKey = opts?.font === 'bold' ? 'F2' : 'F1'
  const size = opts?.size ?? 12
  const color = opts?.color ?? '#0f172a'

  return [
    'BT',
    `/${fontKey} ${size} Tf`,
    fill(color),
    `1 0 0 1 ${x} ${y} Tm`,
    `(${escapePdfText(text)}) Tj`,
    'ET',
  ]
}

function chunkText(input: string, maxChars: number) {
  const safe = sanitizeAscii(input)
  if (safe.length <= maxChars) return [safe]

  const out: string[] = []
  for (let i = 0; i < safe.length; i += maxChars) out.push(safe.slice(i, i + maxChars))
  return out
}

function buildPdf(stream: string): Blob {
  const streamLen = stream.length

  const objects = [
    `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`,
    `2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n`,
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> >>\nendobj\n`,
    `4 0 obj\n<< /Length ${streamLen} >>\nstream\n${stream}endstream\nendobj\n`,
    `5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n`,
    `6 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n`,
  ]

  let pdf = '%PDF-1.4\n'
  const offsets: number[] = []

  for (const obj of objects) {
    offsets.push(pdf.length)
    pdf += obj
  }

  const xrefStart = pdf.length
  pdf += `xref\n0 ${objects.length + 1}\n`
  pdf += '0000000000 65535 f \n'
  for (const off of offsets) {
    pdf += `${pad10(off)} 00000 n \n`
  }

  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`

  return new Blob([pdf], { type: 'application/pdf' })
}

type PdfOptions = {
  title: string
  lines: string[]
}

export function createSimplePdf({ title, lines }: PdfOptions): Blob {
  const contentLines: string[] = []
  contentLines.push(...textAt(title, 72, 750, { font: 'bold', size: 20 }))

  let y = 720
  for (const line of lines) {
    contentLines.push(...textAt(line, 72, y, { size: 12, color: '#334155' }))
    y -= 18
  }

  const stream = `${contentLines.join('\n')}\n`
  return buildPdf(stream)
}

export type ItineraryPdfData = {
  bookingId: string
  passengerName: string
  passengerEmail: string
  flightNumber: string
  gate: string
  departureDate: string
  departureTime: string
  seatCode: string
  issuedAt?: string
}

export function createItineraryPdf(data: ItineraryPdfData): Blob {
  const primary: PdfColorHex = '#4a00e0'
  const secondary: PdfColorHex = '#fe6b5e'
  const ink: PdfColorHex = '#0f172a'
  const muted: PdfColorHex = '#475569'
  const border: PdfColorHex = '#e2e8f0'
  const cardFill: PdfColorHex = '#f8fafc'
  const white: PdfColorHex = '#ffffff'

  const pageW = 612
  const pageH = 792
  const marginX = 56
  const contentW = pageW - marginX * 2

  const headerH = 76
  const headerY = pageH - headerH
  const accentH = 6

  const gap = 16
  const colW = (contentW - gap) / 2
  const rowTopY = 684
  const cardH = 118
  const cardY = rowTopY - cardH
  const leftX = marginX
  const rightX = marginX + colW + gap

  const sectionGap = 18
  const infoH = 160
  const infoTop = cardY - sectionGap
  const infoY = infoTop - infoH

  const supportH = 74
  const supportTop = infoY - sectionGap
  const supportY = supportTop - supportH

  const ops: string[] = []

  // Header
  ops.push(...rectFill(0, headerY, pageW, headerH, primary))
  ops.push(...rectFill(0, headerY, pageW, accentH, secondary))

  ops.push(...textAt('NRG Flight', marginX, headerY + 48, { font: 'bold', size: 18, color: white }))
  ops.push(...textAt('TRAVEL ITINERARY', marginX, headerY + 28, { font: 'bold', size: 11, color: white }))

  const issuedAt = data.issuedAt ? sanitizeAscii(data.issuedAt) : new Date().toISOString().slice(0, 19).replace('T', ' ')
  ops.push(...textAt(`Booking ID: ${data.bookingId}`, marginX, headerY + 12, { size: 10, color: white }))
  ops.push(...textAt(`Issued: ${issuedAt}`, marginX + 300, headerY + 12, { size: 10, color: white }))

  const drawCard = (x: number, y: number, w: number, h: number, accent: PdfColorHex) => {
    // Subtle shadow
    ops.push(...rectFill(x + 2, y - 2, w, h, '#eaeef6'))
    // Card body
    ops.push(...rectFillStroke(x, y, w, h, { fill: cardFill, stroke: border }))
    // Accent stripe
    ops.push(...rectFill(x, y, 4, h, accent))
  }

  drawCard(leftX, cardY, colW, cardH, primary)
  drawCard(rightX, cardY, colW, cardH, secondary)
  drawCard(marginX, infoY, contentW, infoH, primary)
  drawCard(marginX, supportY, contentW, supportH, secondary)

  const passengerTop = cardY + cardH
  ops.push(...textAt('PASSENGER', leftX + 18, passengerTop - 28, { font: 'bold', size: 10, color: muted }))
  ops.push(...textAt(data.passengerName || 'Passenger', leftX + 18, passengerTop - 56, { font: 'bold', size: 16, color: ink }))

  const emailLines = chunkText(data.passengerEmail || '', 34)
  emailLines.slice(0, 2).forEach((line, idx) => {
    ops.push(...textAt(line, leftX + 18, passengerTop - 78 - idx * 14, { size: 11, color: muted }))
  })

  const flightTop = cardY + cardH
  ops.push(...textAt('FLIGHT', rightX + 18, flightTop - 28, { font: 'bold', size: 10, color: muted }))
  ops.push(...textAt(data.flightNumber, rightX + 18, flightTop - 56, { font: 'bold', size: 16, color: ink }))
  ops.push(...textAt(`Departure: ${data.departureDate}  ${data.departureTime}`, rightX + 18, flightTop - 78, { size: 11, color: muted }))
  ops.push(...textAt(`Gate: ${data.gate}`, rightX + 18, flightTop - 96, { size: 11, color: muted }))

  const seatChipW = 92
  const seatChipH = 24
  const seatChipX = rightX + colW - 18 - seatChipW
  const seatChipY = cardY + cardH - 46
  ops.push(...rectFill(seatChipX, seatChipY, seatChipW, seatChipH, secondary))
  ops.push(...textAt(`SEAT ${data.seatCode}`, seatChipX + 12, seatChipY + 7, { font: 'bold', size: 11, color: white }))

  const infoTopY = infoY + infoH
  ops.push(...textAt('IMPORTANT INFORMATION', marginX + 18, infoTopY - 28, { font: 'bold', size: 10, color: muted }))

  const infoLines = [
    'Check-in: Check-in opens 24 hours before departure',
    'Baggage: 1 carry-on + 1 checked bag included',
    'Cancellation: Free cancellation up to 24 hours before departure',
  ]

  infoLines.forEach((line, idx) => {
    ops.push(...textAt(line, marginX + 18, infoTopY - 56 - idx * 18, { size: 11, color: ink }))
  })

  const supportTopY = supportY + supportH
  ops.push(...textAt('SUPPORT', marginX + 18, supportTopY - 28, { font: 'bold', size: 10, color: muted }))
  ops.push(
    ...textAt(
      'For changes or assistance, contact support and reference your Booking ID.',
      marginX + 18,
      supportTopY - 52,
      { size: 11, color: ink },
    ),
  )

  ops.push(...textAt('NRG Flight - schedules and gates are subject to change.', marginX, 48, { size: 9, color: muted }))

  const stream = `${ops.join('\n')}\n`
  return buildPdf(stream)
}
