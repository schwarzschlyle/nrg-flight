import { create, type StateCreator } from 'zustand'

import { createAuthSlice } from '@/store/slices/auth.slice'
import { createBookingFlowSlice } from '@/store/slices/bookingFlow.slice'
import { createTestPageSlice } from '@/store/slices/testPage.slice'
import type { RootStore } from '@/store/store.types'

const creator: StateCreator<RootStore> = (set, get) => ({
  ...createAuthSlice(),
  ...createBookingFlowSlice(),
  ...createTestPageSlice(),

  setAccessToken: (token: string | null) => set({ auth: { ...get().auth, accessToken: token } }),
  setAdminAccessToken: (token: string | null) => set({ auth: { ...get().auth, adminAccessToken: token } }),

  setTestPage: (patch) => set({ testPage: { ...get().testPage, ...patch } }),

  setDepartureDate: (departureDate: string) =>
    set({ bookingFlow: { ...get().bookingFlow, departureDate, slotId: null, flightId: null, selectedSeatId: null } }),
  setAircraftId: (aircraftId: string | null) =>
    set({ bookingFlow: { ...get().bookingFlow, aircraftId, slotId: null, flightId: null, selectedSeatId: null } }),
  setSlotId: (slotId: number | null) =>
    set({ bookingFlow: { ...get().bookingFlow, slotId, flightId: null, selectedSeatId: null } }),
  setFlightId: (flightId: string | null) => set({ bookingFlow: { ...get().bookingFlow, flightId, selectedSeatId: null } }),
  setSelectedSeatId: (selectedSeatId: string | null) => set({ bookingFlow: { ...get().bookingFlow, selectedSeatId } }),
  resetBookingFlow: () =>
    set({
      bookingFlow: {
        departureDate: new Date().toISOString().slice(0, 10),
        aircraftId: null,
        slotId: null,
        flightId: null,
        selectedSeatId: null,
      },
    }),
})

export const useAppStore = create<RootStore>()(creator)
