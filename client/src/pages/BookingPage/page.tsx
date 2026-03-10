import { Container, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { AppHeader } from '@/app/layout/components/AppHeader/organisms/AppHeader'
import { BookingFooter } from '@/app/layout/components/AppFooter/organisms/BookingFooter'
import { DatePickerField } from '@/pages/BookingPage/components/FlightDatePicker/molecules/DatePickerField'
import { FlightCardList } from '@/pages/BookingPage/components/FlightCards/organisms/FlightCardList'
import { SeatSelectionPanel } from '@/pages/BookingPage/components/SeatSelection/organisms/SeatSelectionPanel'
import { BookingChatWidget } from '@/pages/BookingPage/components/Chatbot/organisms/BookingChatWidget'
import { useAppStore } from '@/store'
import type { RootStore } from '@/store/store.types'

export default function BookingPage() {
  const departureDate = useAppStore((s: RootStore) => s.bookingFlow.departureDate)
  const setDepartureDate = useAppStore((s: RootStore) => s.setDepartureDate)

  return (
    <Stack minHeight="100vh">
      <AppHeader active="booking" />

      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
        <Stack spacing={2.5}>
          <Stack spacing={0.75}>
            <Typography variant="h4" fontWeight={950} letterSpacing={-0.6}>
              Book your flight
            </Typography>
            <Typography color="text.secondary">
              Select a date, choose a flight, then pick your seat.
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2.5}
            alignItems={{ md: 'flex-end' }}
            sx={(t) => ({
              p: { xs: 2, sm: 2.5 },
              borderRadius: 4,
              bgcolor: alpha(t.palette.primary.main, 0.04),
              border: `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
            })}
          >
            <DatePickerField value={departureDate} onChange={setDepartureDate} />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              Flights shown are those scheduled by admins for your selected date.
            </Typography>
          </Stack>

          <FlightCardList />
          <SeatSelectionPanel />
        </Stack>
      </Container>

      <BookingChatWidget />

      <BookingFooter />
    </Stack>
  )
}
