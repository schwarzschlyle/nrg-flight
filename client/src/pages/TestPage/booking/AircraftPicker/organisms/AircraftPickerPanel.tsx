import { Alert, Box, CircularProgress, MenuItem, Stack, TextField, Typography } from '@mui/material'

import { useAircraftQuery } from '@/pages/TestPage/api/queries/useAircraftQuery'
import { useAppStore } from '@/store'
import type { RootStore } from '@/store/store.types'

export function AircraftPickerPanel() {
  const aircraftId = useAppStore((s: RootStore) => s.bookingFlow.aircraftId)
  const setAircraftId = useAppStore((s: RootStore) => s.setAircraftId)
  const aircraftQuery = useAircraftQuery()

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6">Choose aircraft</Typography>
        <Typography variant="body2" color="text.secondary">
          Flights are created per date+slot by admins and linked to an aircraft.
        </Typography>
      </Box>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <TextField
          label="Aircraft"
          select
          value={aircraftId ?? ''}
          onChange={(e) => setAircraftId(e.target.value || null)}
          disabled={aircraftQuery.isLoading || aircraftQuery.isError}
          sx={{ minWidth: 340 }}
        >
          <MenuItem value="" disabled>
            {aircraftQuery.isLoading
              ? 'Loading aircraft…'
              : aircraftQuery.isError
                ? 'Failed to load aircraft'
                : 'Select an aircraft'}
          </MenuItem>
          {(aircraftQuery.data ?? []).map((a) => (
            <MenuItem key={a.id} value={a.id}>
              {a.model} — {a.total_rows}×{a.seats_per_row}
            </MenuItem>
          ))}
        </TextField>
        {aircraftQuery.isLoading && <CircularProgress size={20} />}
      </Stack>

      {aircraftQuery.isError && <Alert severity="error">Failed to load aircraft list. Make sure you’re logged in.</Alert>}
    </Stack>
  )
}
