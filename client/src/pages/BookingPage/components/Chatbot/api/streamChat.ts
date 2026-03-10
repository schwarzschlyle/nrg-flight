import { env } from '@/app/config/env'

import type { ChatMsg, PendingBooking } from '@/pages/BookingPage/components/Chatbot/chatbot.types'

type SseEvent =
  | { event: 'meta'; data: { request_id: string } }
  | { event: 'delta'; data: { text: string } }
  | { event: 'state'; data: { pending_booking: PendingBooking } }

function toHistory(messages: ChatMsg[]) {
  return messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))
}

function parseSseBlock(raw: string): { event: string; data: unknown } | null {
  const lines = raw.split('\n').map((l) => l.trim())
  const eventLine = lines.find((l) => l.startsWith('event:'))
  const dataLine = lines.find((l) => l.startsWith('data:'))
  const event = eventLine?.slice('event:'.length).trim() ?? ''
  const dataRaw = dataLine?.slice('data:'.length).trim() ?? '{}'
  if (!event) return null

  try {
    return { event, data: JSON.parse(dataRaw) }
  } catch {
    return { event, data: {} }
  }
}

export async function streamChat(args: {
  message: string
  history: ChatMsg[]
  pendingBooking: PendingBooking
  token: string | null
  onDelta: (t: string) => void
  onState: (p: PendingBooking) => void
  signal: AbortSignal
}) {
  const res = await fetch(`${env.aiBaseUrl}/api/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      ...(args.token ? { Authorization: `Bearer ${args.token}` } : undefined),
    },
    body: JSON.stringify({
      message: args.message,
      history: toHistory(args.history),
      pending_booking: args.pendingBooking,
    }),
    signal: args.signal,
  })

  if (!res.ok) throw new Error(`Chat failed (${res.status})`)
  if (!res.body) throw new Error('No response stream')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  const emit = (event: SseEvent['event'], data: any) => {
    if (event === 'delta') args.onDelta(String(data.text ?? ''))
    if (event === 'state') args.onState((data.pending_booking ?? null) as PendingBooking)
  }

  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    buffer += decoder.decode(value, { stream: true })

    while (true) {
      const idx = buffer.indexOf('\n\n')
      if (idx < 0) break

      const raw = buffer.slice(0, idx)
      buffer = buffer.slice(idx + 2)

      const parsed = parseSseBlock(raw)
      if (!parsed) continue

      emit(parsed.event as SseEvent['event'], parsed.data)
    }
  }
}

