export type TimeSlotFormat = '24h' | '12h'

function clampSlotId(slotId: number) {
  if (!Number.isFinite(slotId)) return 0
  const n = Math.floor(slotId)
  return Math.min(23, Math.max(0, n))
}

export function formatTimeSlot(slotId: number, format: TimeSlotFormat = '24h') {
  const h = clampSlotId(slotId)

  if (format === '12h') {
    const hour12 = h % 12 === 0 ? 12 : h % 12
    const ampm = h < 12 ? 'AM' : 'PM'
    return `${hour12}:00 ${ampm}`
  }

  return `${h.toString().padStart(2, '0')}:00`
}

export type TimeSlotOption = {
  value: number
  label: string
}

export function getTimeSlotOptions(format: TimeSlotFormat = '24h'): TimeSlotOption[] {
  return Array.from({ length: 24 }, (_, slotId) => ({
    value: slotId,
    label: formatTimeSlot(slotId, format),
  }))
}
