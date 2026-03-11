import AddRoadRoundedIcon from '@mui/icons-material/AddRoadRounded'
import { Alert, Box, Button, CircularProgress, MenuItem, Paper, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { useCreateFlightMutation } from '@/app/api/mutations/useCreateFlightMutation'
import { useAircraftQuery } from '@/app/api/queries/useAircraftQuery'
import { getTimeSlotOptions } from '@/app/utils/timeSlots'

import { FlightSchedulerSkeleton } from '../molecules/FlightSchedulerSkeleton'

export function FlightSchedulerPanel() {
  const queryClient = useQueryClient()
  const aircraftQuery = useAircraftQuery()
  const createFlight = useCreateFlightMutation()

  const [departureDate, setDepartureDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [aircraftId, setAircraftId] = useState<string | null>(null)
  const [slotId, setSlotId] = useState(0)

  const slotOptions = useMemo(() => getTimeSlotOptions('24h'), [])

  const aircraftOptions = useMemo(() => aircraftQuery.data ?? [], [aircraftQuery.data])
  const activeAircraftId = useMemo(() => {
    const ids = aircraftOptions.map((a) => a.id)
    if (ids.length === 0) return null
    if (aircraftId && ids.includes(aircraftId)) return aircraftId
    return ids[0]
  }, [aircraftId, aircraftOptions])

  const busy = createFlight.isPending
  const canSubmit = !!activeAircraftId && slotId >= 0 && slotId <= 23

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
        <Stack direction="row" spacing={1.25} alignItems="center">
          <Box
            sx={(t) => ({
              width: 36,
              height: 36,
              borderRadius: 3,
              bgcolor: alpha(t.palette.primary.main, 0.12),
              display: 'grid',
              placeItems: 'center',
            })}
          >
            <AddRoadRoundedIcon color="primary" fontSize="small" />
          </Box>
          <Box>
            <Typography fontWeight={900}>Schedule flight</Typography>
            <Typography variant="body2" color="text.secondary">
              Create a flight for a date + slot and auto-generate all seats.
            </Typography>
          </Box>
        </Stack>

        {aircraftQuery.isLoading ? (
          <FlightSchedulerSkeleton />
        ) : (
          <>
            <Stack
              direction={{ xs: 'column', md: 'row' }}
              spacing={1.5}
              useFlexGap
              sx={{ flexWrap: { md: 'wrap' } }}
            >
              <TextField
                label="Departure date"
                type="date"
                value={departureDate}
                onChange={(e) => setDepartureDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ flex: '1 1 220px', minWidth: 0 }}
              />
              <TextField
                label="Aircraft"
                select
                value={activeAircraftId ?? ''}
                onChange={(e) => setAircraftId(e.target.value || null)}
                disabled={aircraftQuery.isLoading || aircraftQuery.isError}
                sx={{ flex: '2 1 280px', minWidth: 0 }}
              >
                <MenuItem value="" disabled>
                  {aircraftQuery.isLoading
                    ? 'Loading aircraft…'
                    : aircraftQuery.isError
                      ? 'Failed to load aircraft'
                      : 'Select an aircraft'}
                </MenuItem>
                {aircraftOptions.map((a) => (
                  <MenuItem key={a.id} value={a.id}>
                    {a.model} — {a.total_rows}×{a.seats_per_row}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Departure time"
                select
                value={slotId}
                onChange={(e) => setSlotId(Number(e.target.value))}
                sx={{ flex: '1 1 160px', minWidth: 0 }}
              >
                {slotOptions.map((opt) => (
                  <MenuItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                onClick={async () => {
                  if (!activeAircraftId) return
                  await createFlight.mutateAsync({
                    time_slot_id: slotId,
                    aircraft_id: activeAircraftId,
                    departure_date: departureDate,
                  })
                  await queryClient.invalidateQueries({ queryKey: ['slots', departureDate] })
                }}
                disabled={!canSubmit || busy}
              >
                Create flight
              </Button>
              {busy && <CircularProgress size={18} />}
            </Stack>
          </>
        )}

        {createFlight.isSuccess && (
          <Alert severity="success">
            Flight created: <strong>{createFlight.data.flight_number}</strong> (Gate {createFlight.data.gate}).
          </Alert>
        )}
        {createFlight.isError && <Alert severity="error">{(createFlight.error as Error).message}</Alert>}
      </Stack>
    </Paper>
  )
}
