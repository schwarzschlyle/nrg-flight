import { Alert, Box, Button, CircularProgress, Divider, Stack, Typography } from '@mui/material'

import { useAppStore } from '@/store'
import { useBookSeatMutation } from '@/pages/TestPage/api/mutations/useBookSeatMutation'
import { useFirstAvailableSeatQuery } from '@/pages/TestPage/api/queries/useFirstAvailableSeatQuery'
import { useSeatMapQuery } from '@/pages/TestPage/api/queries/useSeatMapQuery'
import { SeatGrid } from '@/pages/TestPage/SeatPicker/molecules/SeatGrid'
import type { RootStore } from '@/store/store.types'

export function SeatPickerPanel() {
  const flightId = useAppStore((s: RootStore) => s.bookingFlow.flightId)
  const selectedSeatId = useAppStore((s: RootStore) => s.bookingFlow.selectedSeatId)
  const setSelectedSeatId = useAppStore((s: RootStore) => s.setSelectedSeatId)

  const seatMapQuery = useSeatMapQuery(flightId)
  const firstAvailableSeatQuery = useFirstAvailableSeatQuery(flightId)
  const bookSeat = useBookSeatMutation()

  const onPickFirstAvailable = async () => {
    const seat = await firstAvailableSeatQuery.refetch()
    if (seat.data?.seat_id) setSelectedSeatId(seat.data.seat_id)
  }

  const onBook = async () => {
    if (!flightId || !selectedSeatId) return
    await bookSeat.mutateAsync({ flight_id: flightId, seat_id: selectedSeatId })
    await seatMapQuery.refetch()
  }

  const isLoading = seatMapQuery.isLoading || firstAvailableSeatQuery.isFetching || bookSeat.isPending

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6">Seat selection</Typography>
        <Typography variant="body2" color="text.secondary">
          Feature 01: seat map + booked indicators • Feature 02: pick first available • Feature 03: pick a seat by
          code (click)
        </Typography>
      </Box>

      {!flightId && <Alert severity="info">Select a flight to load its seat map.</Alert>}

      {flightId && seatMapQuery.isError && (
        <Alert severity="error">Failed to load seats. Check that the flight exists and your JWT is valid.</Alert>
      )}

      {flightId && seatMapQuery.data && (
        <SeatGrid
          seats={seatMapQuery.data.seats}
          selectedSeatId={selectedSeatId}
          onSelectSeatId={setSelectedSeatId}
        />
      )}

      <Divider />

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
        <Button variant="outlined" onClick={onPickFirstAvailable} disabled={!flightId || isLoading}>
          Assign first available
        </Button>
        <Button variant="contained" onClick={onBook} disabled={!flightId || !selectedSeatId || isLoading}>
          Book selected seat
        </Button>
        {isLoading && <CircularProgress size={20} />}
      </Stack>

      {bookSeat.isSuccess && (
        <Alert severity="success">
          Booked seat <strong>{bookSeat.data.seat_code}</strong> on flight <strong>{bookSeat.data.flight_number}</strong>
          (Gate {bookSeat.data.gate}).
        </Alert>
      )}

      {bookSeat.isError && (bookSeat.error as Error).message.includes('Seat already booked') && (
        <Alert severity="warning">That seat was just booked. Please choose another seat.</Alert>
      )}

      {bookSeat.isError && <Alert severity="error">{(bookSeat.error as Error).message}</Alert>}
    </Stack>
  )
}
