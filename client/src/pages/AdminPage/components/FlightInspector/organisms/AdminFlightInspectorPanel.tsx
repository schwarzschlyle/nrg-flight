import { Alert, Box, CircularProgress, Divider, MenuItem, Paper, Skeleton, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useMemo, useState } from 'react'

import { useAircraftQuery } from '@/app/api/queries/useAircraftQuery'
import { useManifestQuery } from '@/app/api/queries/useManifestQuery'
import { useSeatMapQuery } from '@/app/api/queries/useSeatMapQuery'
import { useSlotFlightQuery } from '@/app/api/queries/useSlotFlightQuery'
import { useSlotsQuery } from '@/app/api/queries/useSlotsQuery'
import { SeatMap } from '@/pages/shared/components/SeatMap/organisms/SeatMap'
import { SeatMapSkeleton } from '@/pages/shared/components/SeatMap/molecules/SeatMapSkeleton'
import { formatTimeSlot } from '@/app/utils/timeSlots'
import { useAppStore } from '@/store'
import type { RootStore } from '@/store/store.types'

import { InspectorSkeleton } from '../molecules/InspectorSkeleton'

export function AdminFlightInspectorPanel() {
  const departureDate = useAppStore((s: RootStore) => s.bookingFlow.departureDate)
  const setDepartureDate = useAppStore((s: RootStore) => s.setDepartureDate)

  const [aircraftId, setAircraftId] = useState<string | null>(null)
  const [slotId, setSlotId] = useState<number | null>(null)

  const aircraftQuery = useAircraftQuery()
  const slotsQuery = useSlotsQuery(departureDate)
  const slotFlightQuery = useSlotFlightQuery(slotId, departureDate)

  const safeAircraftId = useMemo(() => {
    if (!aircraftId) return null
    return (aircraftQuery.data ?? []).some((a) => a.id === aircraftId) ? aircraftId : null
  }, [aircraftId, aircraftQuery.data])

  const filteredSlots = useMemo(() => {
    const withFlights = (slotsQuery.data ?? [])
      .filter((s) => !!s.flight_id)
      .slice()
      .sort((a, b) => a.slot_id - b.slot_id)

    if (!safeAircraftId) return withFlights
    return withFlights.filter((s) => s.aircraft_id === safeAircraftId)
  }, [slotsQuery.data, safeAircraftId])

  const flightId = slotFlightQuery.data?.flight_id ?? null
  const seatMapQuery = useSeatMapQuery(flightId)
  const manifestQuery = useManifestQuery(flightId)

  const isLoading = aircraftQuery.isLoading || slotsQuery.isLoading

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
            Flight inspector
          </Typography>
          <Typography variant="body2" color="text.secondary">
            View seat availability and passenger manifest for any scheduled flight.
          </Typography>
        </Stack>

        {isLoading ? (
          <InspectorSkeleton />
        ) : (
          <>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              alignItems={{ md: 'center' }}
              useFlexGap
              sx={{ flexWrap: { md: 'wrap' } }}
            >
              <TextField
                label="Departure date"
                type="date"
                value={departureDate}
                onChange={(e) => {
                  setDepartureDate(e.target.value)
                  setSlotId(null)
                }}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: '1 1 220px', minWidth: 0 }}
              />

              <TextField
                label="Aircraft"
                select
                value={safeAircraftId ?? ''}
                onChange={(e) => {
                  setAircraftId(e.target.value || null)
                  setSlotId(null)
                }}
                disabled={aircraftQuery.isLoading || aircraftQuery.isError}
                sx={{ flex: '1 1 260px', minWidth: 0 }}
              >
                <MenuItem value="">All aircraft</MenuItem>
                {(aircraftQuery.data ?? []).map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.model}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Flight (slot)"
                select
                value={slotId ?? ''}
                onChange={(e) => setSlotId(Number(e.target.value))}
                disabled={!slotsQuery.data || slotsQuery.isError}
                sx={{ flex: '2 1 320px', minWidth: 0 }}
              >
                <MenuItem value="" disabled>
                  {slotsQuery.isLoading
                    ? 'Loading flights…'
                    : slotsQuery.isError
                      ? 'Failed to load flights'
                      : 'Select a flight'}
                </MenuItem>
                {filteredSlots.map((s) => (
                  <MenuItem key={s.slot_id} value={s.slot_id}>
                    {formatTimeSlot(s.slot_id, '24h')} — {s.flight_number} — Gate {s.gate} — {s.available_seats}/{s.total_seats}
                  </MenuItem>
                ))}
              </TextField>

              {slotFlightQuery.isFetching && <CircularProgress size={18} />}
            </Stack>

            {aircraftQuery.isError && <Alert severity="error">Failed to load aircraft list.</Alert>}
            {slotsQuery.isError && <Alert severity="error">Failed to load flights for this date.</Alert>}
            {slotsQuery.isSuccess && filteredSlots.length === 0 && (
              <Alert severity="info">No flights found for the selected date/filter.</Alert>
            )}
            {slotId !== null && slotFlightQuery.isError && <Alert severity="error">Flight not found for this slot.</Alert>}

            {flightId && slotFlightQuery.data && (
              <Alert severity="success">
                Loaded <strong>{slotFlightQuery.data.flight_number}</strong> (Gate {slotFlightQuery.data.gate}, {slotFlightQuery.data.departure_time}).
              </Alert>
            )}

            <Divider />

            {flightId && seatMapQuery.isError && <Alert severity="error">Failed to load seat map.</Alert>}
            {flightId && seatMapQuery.isLoading && <SeatMapSkeleton rows={6} seatsPerRow={6} />}
            {flightId && seatMapQuery.data && (
              <Box
                sx={(t) => ({
                  borderRadius: 4,
                  p: { xs: 1.5, sm: 2 },
                  bgcolor: alpha(t.palette.primary.main, 0.03),
                  border: `1px dashed ${alpha(t.palette.primary.main, 0.35)}`,
                  overflowX: 'auto',
                  maxWidth: '100%',
                })}
              >
                <SeatMap seats={seatMapQuery.data.seats} selectedSeatId={null} onSelectSeatId={() => void 0} interactive={false} />
              </Box>
            )}

            <Divider />

            {flightId && manifestQuery.isError && <Alert severity="error">Failed to load manifest.</Alert>}
            {flightId && manifestQuery.isLoading && (
              <Stack spacing={1}>
                <Skeleton variant="text" width={220} height={22} />
                {Array.from({ length: 3 }, (_, i) => (
                  <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 3 }} />
                ))}
              </Stack>
            )}
            {flightId && manifestQuery.data && (
              <Stack spacing={1}>
                <Typography fontWeight={900}>Passenger manifest</Typography>
                {manifestQuery.data.length === 0 && <Alert severity="info">No confirmed passengers yet.</Alert>}
                {manifestQuery.data.map((p) => (
                  <Box
                    key={`${p.account_id}-${p.seat_code}`}
                    sx={(t) => ({
                      display: 'grid',
                      gridTemplateColumns: '64px 1fr',
                      gap: 1.5,
                      p: 1.25,
                      borderRadius: 3,
                      border: `1px solid ${alpha(t.palette.divider, 0.9)}`,
                    })}
                  >
                    <Typography fontWeight={900}>{p.seat_code}</Typography>
                    <Box>
                      <Typography fontWeight={800}>{p.full_name}</Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                        {p.email}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </>
        )}
      </Stack>
    </Paper>
  )
}
