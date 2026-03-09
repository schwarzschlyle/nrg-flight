export type SlotResponse = {
  slot_id: number
  label: string
  flight_number: string
  gate: string
  flight_id: string | null
  aircraft_id: string | null
  aircraft_model: string | null
  total_seats: number
  available_seats: number
}

export type SlotFlightResponse = {
  flight_id: string
  flight_number: string
  gate: string
  departure_date: string
  departure_time: string
}

export type FlightResponse = {
  flight_id: string
  flight_number: string
  gate: string
  departure_date: string
  departure_time: string
  aircraft_model: string
  total_seats: number
  available_seats: number
  is_active: boolean
}
