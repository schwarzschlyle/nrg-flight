import type { AuthSlice } from '@/store/slices/auth.slice'
import type { BookingFlowSlice } from '@/store/slices/bookingFlow.slice'
import type { TestPageSlice } from '@/store/slices/testPage.slice'

export type RootStore = AuthSlice & BookingFlowSlice & TestPageSlice
