import {
  Alert,
  Box,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo, useState } from 'react'

import { useAircraftQuery } from '@/pages/TestPage/api/queries/useAircraftQuery'
import { useManifestQuery } from '@/pages/TestPage/api/queries/useManifestQuery'
import { useSeatMapQuery } from '@/pages/TestPage/api/queries/useSeatMapQuery'
import { useSlotFlightQuery } from '@/pages/TestPage/api/queries/useSlotFlightQuery'
import { useSlotsQuery } from '@/pages/TestPage/api/queries/useSlotsQuery'
import { SeatGrid } from '@/pages/TestPage/SeatPicker/molecules/SeatGrid'
import { useAppStore } from '@/store'
import type { RootStore } from '@/store/store.types'

export function FlightInspectorPanel() {
  const departureDate = useAppStore((s: RootStore) => s.bookingFlow.departureDate)
  const setDepartureDate = useAppStore((s: RootStore) => s.setDepartureDate)
  const adminToken = useAppStore((s: RootStore) => s.auth.adminAccessToken)

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
    const withFlights = (slotsQuery.data ?? []).filter((s) => !!s.flight_id)
    if (!safeAircraftId) return withFlights
    return withFlights.filter((s) => s.aircraft_id === safeAircraftId)
  }, [slotsQuery.data, safeAircraftId])

  const flightId = slotFlightQuery.data?.flight_id ?? null
  const seatMapQuery = useSeatMapQuery(flightId)
  const manifestQuery = useManifestQuery(flightId)

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6">Flight inspector</Typography>
        <Typography variant="body2" color="text.secondary">
          View a flight’s seat map and passenger manifest.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <TextField
          label="Departure date"
          type="date"
          value={departureDate}
          onChange={(e) => {
            setDepartureDate(e.target.value)
            setSlotId(null)
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 220 }}
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
          sx={{ minWidth: 320 }}
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
          sx={{ minWidth: 320 }}
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
              {s.label} — {s.flight_number} — {s.gate} — {s.aircraft_model}
            </MenuItem>
          ))}
        </TextField>

        {(aircraftQuery.isLoading || slotsQuery.isLoading || slotFlightQuery.isFetching) && <CircularProgress size={20} />}
      </Stack>

      {aircraftQuery.isError && <Alert severity="error">Failed to load aircraft list.</Alert>}
      {slotsQuery.isError && <Alert severity="error">Failed to load slots.</Alert>}

      {slotsQuery.isSuccess && filteredSlots.length === 0 && (
        <Alert severity="info">No flights found for the selected date/filter.</Alert>
      )}

      {slotId !== null && slotFlightQuery.isError && <Alert severity="error">Flight not found for this slot.</Alert>}

      {flightId && slotFlightQuery.data && (
        <Alert severity="success">
          Loaded flight <strong>{slotFlightQuery.data.flight_number}</strong> (Gate {slotFlightQuery.data.gate}, {slotFlightQuery.data.departure_time}).
        </Alert>
      )}

      <Divider />

      {flightId && seatMapQuery.isError && <Alert severity="error">Failed to load seat map.</Alert>}
      {flightId && seatMapQuery.data && (
        <SeatGrid seats={seatMapQuery.data.seats} selectedSeatId={null} onSelectSeatId={() => void 0} interactive={false} />
      )}

      <Divider />

      {flightId && manifestQuery.isError && <Alert severity="error">Failed to load manifest.</Alert>}
      {flightId && !adminToken && (
        <Alert severity="info">Login as admin to view the passenger manifest.</Alert>
      )}
      {flightId && manifestQuery.data && (
        <Stack spacing={1}>
          <Typography variant="subtitle2">Passenger manifest</Typography>
          {manifestQuery.data.length === 0 && <Alert severity="info">No confirmed passengers yet.</Alert>}
          {manifestQuery.data.map((p) => (
            <Box key={`${p.account_id}-${p.seat_code}`} display="flex" gap={1.5} alignItems="baseline">
              <Typography variant="body2" sx={{ minWidth: 48 }}>
                {p.seat_code}
              </Typography>
              <Typography variant="body2">{p.full_name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {p.email}
              </Typography>
            </Box>
          ))}
        </Stack>
      )}
    </Stack>
  )
}
