export type CreateAircraftRequest = {
  model: string
  total_rows: number
  seats_per_row: number
}

export type CreateFlightRequest = {
  time_slot_id: number
  aircraft_id: string
  departure_date: string
}

export type ManifestEntryResponse = {
  account_id: string
  full_name: string
  email: string
  seat_code: string
}
