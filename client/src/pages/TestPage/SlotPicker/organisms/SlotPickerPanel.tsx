import { Alert, Box, CircularProgress, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useMemo } from 'react'

import { useAppStore } from '@/store'
import { useSlotsQuery } from '@/pages/TestPage/api/queries/useSlotsQuery'
import type { RootStore } from '@/store/store.types'

export function SlotPickerPanel() {
  const departureDate = useAppStore((s: RootStore) => s.bookingFlow.departureDate)
  const aircraftId = useAppStore((s: RootStore) => s.bookingFlow.aircraftId)
  const slotId = useAppStore((s: RootStore) => s.bookingFlow.slotId)
  const setDepartureDate = useAppStore((s: RootStore) => s.setDepartureDate)
  const setSlotId = useAppStore((s: RootStore) => s.setSlotId)
  const setFlightId = useAppStore((s: RootStore) => s.setFlightId)

  const slotsQuery = useSlotsQuery(departureDate)

  const flightsForAircraft = useMemo(
    () => (slotsQuery.data ?? []).filter((s) => !!s.flight_id && s.aircraft_id === aircraftId),
    [slotsQuery.data, aircraftId],
  )

  const onChooseFlight = (newSlotId: number) => {
    setSlotId(newSlotId)

    const slot = flightsForAircraft.find((s) => s.slot_id === newSlotId)
    setFlightId(slot?.flight_id ?? null)
  }

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6">Choose date & time slot</Typography>
        <Typography variant="body2" color="text.secondary">
          Select a date to list flights created by admins for that day.
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
          label="Flight"
          select
          value={slotId ?? ''}
          onChange={(e) => void onChooseFlight(Number(e.target.value))}
          disabled={!aircraftId || slotsQuery.isLoading || slotsQuery.isError}
          sx={{ minWidth: 360 }}
        >
          <MenuItem value="" disabled>
            {slotsQuery.isLoading
              ? 'Loading flights…'
              : slotsQuery.isError
                ? 'Failed to load flights'
                : 'Select a flight'}
          </MenuItem>
          {flightsForAircraft.map((slot) => (
            <MenuItem key={slot.slot_id} value={slot.slot_id} disabled={slot.available_seats === 0}>
              {slot.label} — {slot.flight_number} — Gate {slot.gate} — {slot.available_seats}/{slot.total_seats}
            </MenuItem>
          ))}
        </TextField>
        {slotsQuery.isLoading && <CircularProgress size={20} />}
      </Stack>

      {!aircraftId && <Alert severity="info">Choose an aircraft first to see its available flights.</Alert>}

      {slotsQuery.isError && <Alert severity="error">Failed to load slots. Make sure you’re logged in.</Alert>}

      {aircraftId && slotsQuery.isSuccess && flightsForAircraft.length === 0 && (
        <Alert severity="warning">No flights found for this aircraft on the selected date.</Alert>
      )}
    </Stack>
  )
}
