export type SeatResponse = {
  seat_id: string
  seat_code: string
  row_number: number
  seat_letter: string
  is_booked: boolean
}

export type SeatMapResponse = {
  flight_id: string
  seats: SeatResponse[]
}
