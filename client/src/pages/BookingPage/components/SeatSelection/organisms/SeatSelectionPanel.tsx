import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded'
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded'
import { Alert, Box, Button, Divider, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo, useState } from 'react'

import { ApiError } from '@/app/api/http'
import { useBookSeatMutation } from '@/app/api/mutations/useBookSeatMutation'
import { useFirstAvailableSeatQuery } from '@/app/api/queries/useFirstAvailableSeatQuery'
import { useSeatMapQuery } from '@/app/api/queries/useSeatMapQuery'
import { useAuth } from '@/app/auth/useAuth'
import { SeatMap } from '@/pages/shared/components/SeatMap/organisms/SeatMap'
import { useAppStore } from '@/store'
import type { RootStore } from '@/store/store.types'

import { createItineraryPdf } from '@/app/utils/pdf'

import { SeatLegend } from '../molecules/SeatLegend'
import { SeatMapSkeleton } from '@/pages/shared/components/SeatMap/molecules/SeatMapSkeleton'

type Itinerary = {
  fileName: string
  blob: Blob
}

function formatIssuedAt(iso: string) {
  // Keep it stable + readable in the PDF header.
  return iso.slice(0, 19).replace('T', ' ')
}

function generateItineraryPdf(payload: {
  passengerName: string
  passengerEmail: string
  flightNumber: string
  gate: string
  departureDate: string
  departureTime: string
  seatCode: string
  bookingId: string
  bookedAt?: string
}): Itinerary {
  const blob = createItineraryPdf({
    bookingId: payload.bookingId,
    passengerName: payload.passengerName,
    passengerEmail: payload.passengerEmail,
    flightNumber: payload.flightNumber,
    gate: payload.gate,
    departureDate: payload.departureDate,
    departureTime: payload.departureTime,
    seatCode: payload.seatCode,
    issuedAt: payload.bookedAt ? formatIssuedAt(payload.bookedAt) : undefined,
  })
  const safeFlight = payload.flightNumber.replace(/\s+/g, '')
  const fileName = `NRGFlight-Itinerary-${safeFlight}-${payload.seatCode}.pdf`
  return { fileName, blob }
}

export function SeatSelectionPanel() {
  const { account } = useAuth()

  const flightId = useAppStore((s: RootStore) => s.bookingFlow.flightId)
  const selectedSeatId = useAppStore((s: RootStore) => s.bookingFlow.selectedSeatId)
  const setSelectedSeatId = useAppStore((s: RootStore) => s.setSelectedSeatId)

  const seatMapQuery = useSeatMapQuery(flightId)
  const firstAvailableSeatQuery = useFirstAvailableSeatQuery(flightId)
  const bookSeat = useBookSeatMutation()

  const [itinerary, setItinerary] = useState<Itinerary | null>(null)

  const busy = firstAvailableSeatQuery.isFetching || bookSeat.isPending

  const onPickFirstAvailable = async () => {
    const seat = await firstAvailableSeatQuery.refetch()
    if (seat.data?.seat_id) setSelectedSeatId(seat.data.seat_id)
  }

  const onBook = async () => {
    if (!flightId || !selectedSeatId) return
    const booking = await bookSeat.mutateAsync({ flight_id: flightId, seat_id: selectedSeatId })
    await seatMapQuery.refetch()

    const passengerName = account?.full_name ?? 'Passenger'
    const passengerEmail = account?.email ?? ''

    setItinerary(
      generateItineraryPdf({
        passengerName,
        passengerEmail,
        flightNumber: booking.flight_number,
        gate: booking.gate,
        departureDate: booking.departure_date,
        departureTime: booking.departure_time,
        seatCode: booking.seat_code,
        bookingId: booking.booking_id,
        bookedAt: booking.booked_at,
      }),
    )
  }

  const bookingErrorMsg = useMemo(() => {
    if (!bookSeat.isError) return null
    const err = bookSeat.error
    if (err instanceof ApiError && err.status === 409) return err.message
    return (err as Error).message
  }, [bookSeat.error, bookSeat.isError])

  return (
    <Paper
      elevation={0}
      sx={(t) => ({
        p: { xs: 2, sm: 2.5 },
        borderRadius: 4,
        border: `1px solid ${alpha(t.palette.divider, 0.9)}`,
        bgcolor: alpha(t.palette.background.paper, 0.92),
      })}
    >
      <Stack spacing={2}>
        <Stack spacing={0.25}>
          <Typography variant="h6" fontWeight={900}>
            Seat selection
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Choose a seat on the seat map, or let us pick the first available.
          </Typography>
        </Stack>

        {!flightId && <Alert severity="info">Select a flight to load its seat map.</Alert>}

        {flightId && seatMapQuery.isError && (
          <Alert severity="error">Failed to load seats. Please refresh or sign in again.</Alert>
        )}

        {flightId && (
          <Stack spacing={1.5}>
            <SeatLegend />
            <Divider />

            {seatMapQuery.isLoading && <SeatMapSkeleton />}

            {!seatMapQuery.isLoading && seatMapQuery.data && (
              <Box
                sx={(t) => ({
                  borderRadius: 4,
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: alpha(t.palette.primary.main, 0.03),
                  border: `1px dashed ${alpha(t.palette.primary.main, 0.35)}`,
                })}
              >
                <SeatMap seats={seatMapQuery.data.seats} selectedSeatId={selectedSeatId} onSelectSeatId={setSelectedSeatId} />
              </Box>
            )}

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
              <Button
                variant="outlined"
                startIcon={<AutoFixHighRoundedIcon />}
                onClick={onPickFirstAvailable}
                disabled={!flightId || busy || seatMapQuery.isLoading}
              >
                First available
              </Button>
              <Button
                variant="contained"
                onClick={onBook}
                disabled={!flightId || !selectedSeatId || busy || seatMapQuery.isLoading}
              >
                Book selected seat
              </Button>
            </Stack>
          </Stack>
        )}

        {bookSeat.isSuccess && (
          <Alert severity="success">
            Booked <strong>{bookSeat.data.seat_code}</strong> on flight{' '}
            <strong>{bookSeat.data.flight_number}</strong> (Gate {bookSeat.data.gate}).
          </Alert>
        )}

        {bookingErrorMsg && (
          <Alert severity={bookingErrorMsg.includes('Seat already booked') ? 'warning' : 'error'}>
            {bookingErrorMsg.includes('Seat already booked')
              ? 'That seat was just booked. Please choose another.'
              : bookingErrorMsg}
          </Alert>
        )}

        {itinerary && bookSeat.isSuccess && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<DownloadRoundedIcon />}
            onClick={() => {
              const url = URL.createObjectURL(itinerary.blob)
              const a = document.createElement('a')
              a.href = url
              a.download = itinerary.fileName
              a.click()
              URL.revokeObjectURL(url)
            }}
            sx={{ alignSelf: 'flex-start' }}
          >
            Download itinerary PDF
          </Button>
        )}
      </Stack>
    </Paper>
  )
}
