import { Divider, Stack, Typography } from '@mui/material'

import { AuthPanel } from '@/pages/TestPage/AuthPanel/organisms/AuthPanel'
import { FlightPickerPanel } from '@/pages/TestPage/booking/FlightPicker/organisms/FlightPickerPanel'
import { SeatPickerPanel } from '@/pages/TestPage/SeatPicker/organisms/SeatPickerPanel'

export function TestBookingPage() {
  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h6">Flight booking</Typography>
        <Typography variant="body2" color="text.secondary">
          Choose a date, pick a flight (with aircraft), then book a seat.
        </Typography>
      </Stack>

      <AuthPanel />
      <Divider />
      <FlightPickerPanel />
      <Divider />
      <SeatPickerPanel />
    </Stack>
  )
}
