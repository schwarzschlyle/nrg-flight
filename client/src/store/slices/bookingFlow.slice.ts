export type BookingFlowSlice = {
  bookingFlow: {
    departureDate: string
    aircraftId: string | null
    slotId: number | null
    flightId: string | null
    selectedSeatId: string | null
  }
  setDepartureDate: (date: string) => void
  setAircraftId: (aircraftId: string | null) => void
  setSlotId: (slotId: number | null) => void
  setFlightId: (flightId: string | null) => void
  setSelectedSeatId: (seatId: string | null) => void
  resetBookingFlow: () => void
}

export const createBookingFlowSlice = (): BookingFlowSlice => ({
  bookingFlow: {
    departureDate: new Date().toISOString().slice(0, 10),
    aircraftId: null,
    slotId: null,
    flightId: null,
    selectedSeatId: null,
  },
  setDepartureDate: (date) => void date,
  setAircraftId: (aircraftId) => void aircraftId,
  setSlotId: (slotId) => void slotId,
  setFlightId: (flightId) => void flightId,
  setSelectedSeatId: (seatId) => void seatId,
  resetBookingFlow: () => void 0,
})
