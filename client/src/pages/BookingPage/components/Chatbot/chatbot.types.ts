export type ChatMsg = {
  role: 'user' | 'assistant'
  content: string
}

export type PendingBooking = {
  departure_date?: string | null
  slot_id?: number | null
  seat_code?: string | null
  aircraft_id?: string | null
  aircraft_model?: string | null
} | null
