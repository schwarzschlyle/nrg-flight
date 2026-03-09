export type TestPageState = {
  userEmail: string
  userPassword: string
  userFullName: string

  adminEmail: string
  adminPassword: string
  adminFullName: string

  aircraftModel: string
  aircraftRows: number
  aircraftSeatsPerRow: number
  aircraftId: string | null

  adminDepartureDate: string
  adminTimeSlotId: number
}

export type TestPageSlice = {
  testPage: TestPageState
  setTestPage: (patch: Partial<TestPageState>) => void
}

export const createTestPageSlice = (): TestPageSlice => ({
  testPage: {
    userEmail: 'user@example.com',
    userPassword: 'password123',
    userFullName: 'User',

    adminEmail: 'admin@example.com',
    adminPassword: 'password123',
    adminFullName: 'Admin',

    aircraftModel: 'Boeing 737-800',
    aircraftRows: 2,
    aircraftSeatsPerRow: 2,
    aircraftId: null,

    adminDepartureDate: new Date().toISOString().slice(0, 10),
    adminTimeSlotId: 0,
  },
  setTestPage: (patch) => void patch,
})
