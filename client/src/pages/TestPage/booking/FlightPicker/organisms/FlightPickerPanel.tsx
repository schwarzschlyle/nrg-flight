import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Typography,
} from '@mui/material'
import { useMemo } from 'react'

import { useSlotsQuery } from '@/pages/TestPage/api/queries/useSlotsQuery'
import { useAppStore } from '@/store'
import type { RootStore } from '@/store/store.types'

export function FlightPickerPanel() {
  const departureDate = useAppStore((s: RootStore) => s.bookingFlow.departureDate)
  const slotId = useAppStore((s: RootStore) => s.bookingFlow.slotId)
  const setDepartureDate = useAppStore((s: RootStore) => s.setDepartureDate)
  const setSlotId = useAppStore((s: RootStore) => s.setSlotId)
  const setFlightId = useAppStore((s: RootStore) => s.setFlightId)
  const setAircraftId = useAppStore((s: RootStore) => s.setAircraftId)

  const slotsQuery = useSlotsQuery(departureDate)

  const flights = useMemo(
    () => (slotsQuery.data ?? []).filter((s) => !!s.flight_id).sort((a, b) => a.slot_id - b.slot_id),
    [slotsQuery.data],
  )

  const onSelect = (newSlotId: number) => {
    const slot = flights.find((s) => s.slot_id === newSlotId)
    setAircraftId(slot?.aircraft_id ?? null)
    setSlotId(newSlotId)
    setFlightId(slot?.flight_id ?? null)
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6">Choose flight</Typography>
        <Typography variant="body2" color="text.secondary">
          Choose a departure date to see available flights (with aircraft) set up by admins.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <TextField
          label="Departure date"
          type="date"
          value={departureDate}
          onChange={(e) => setDepartureDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 220 }}
        />
        {slotsQuery.isLoading && <CircularProgress size={20} />}
      </Stack>

      {slotsQuery.isError && <Alert severity="error">Failed to load flights. Make sure you’re logged in.</Alert>}

      {slotsQuery.isSuccess && flights.length === 0 && (
        <Alert severity="info">No flights available for this date.</Alert>
      )}

      {flights.length > 0 && (
        <FormControl>
          <RadioGroup value={slotId ?? ''} onChange={(_, v) => onSelect(Number(v))}>
            {flights.map((f) => {
              const disabled = f.available_seats === 0
              const aircraft = f.aircraft_model ?? 'Unknown aircraft'
              const label = `${f.label} — ${f.flight_number} — Gate ${f.gate} — ${aircraft} — ${f.available_seats}/${f.total_seats}`

              return (
                <FormControlLabel
                  key={f.slot_id}
                  value={f.slot_id}
                  control={<Radio />}
                  disabled={disabled}
                  label={label}
                />
              )
            })}
          </RadioGroup>
        </FormControl>
      )}
    </Stack>
  )
}
