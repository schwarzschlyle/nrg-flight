export type CreateBookingRequest = {
  flight_id: string
  seat_id: string
}

export type BookingResponse = {
  booking_id: string
  status: string
  seat_code: string
  flight_number: string
  gate: string
  departure_date: string
  departure_time: string
  booked_at: string
}

export type BookingListResponse = {
  items: BookingResponse[]
  total: number
}
