import FlightClassRoundedIcon from '@mui/icons-material/FlightClassRounded'
import { Alert, Box, Button, CircularProgress, Paper, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useState } from 'react'

import { useCreateAircraftMutation } from '@/app/api/mutations/useCreateAircraftMutation'
import { useAircraftQuery } from '@/app/api/queries/useAircraftQuery'

import { AircraftCreatorSkeleton } from '../molecules/AircraftCreatorSkeleton'

export function AircraftCreatorPanel() {
  const aircraftQuery = useAircraftQuery()
  const createAircraft = useCreateAircraftMutation()

  const [model, setModel] = useState('Boeing 737-800')
  const [rows, setRows] = useState(12)
  const [seatsPerRow, setSeatsPerRow] = useState(6)

  const busy = createAircraft.isPending
  const canSubmit = model.trim().length > 0 && rows > 0 && seatsPerRow > 0

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
              bgcolor: alpha(t.palette.secondary.main, 0.12),
              display: 'grid',
              placeItems: 'center',
            })}
          >
            <FlightClassRoundedIcon color="secondary" fontSize="small" />
          </Box>
          <Box>
            <Typography fontWeight={900}>Create aircraft</Typography>
            <Typography variant="body2" color="text.secondary">
              Add a new plane model and generate its seat layout.
            </Typography>
          </Box>
        </Stack>

        {aircraftQuery.isLoading ? (
          <AircraftCreatorSkeleton />
        ) : (
          <>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              useFlexGap
              sx={{ flexWrap: { sm: 'wrap' } }}
            >
              <TextField
                label="Model"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                sx={{ flex: '2 1 260px', minWidth: 0 }}
              />
              <TextField
                label="Rows"
                type="number"
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
                sx={{ flex: '1 1 120px', minWidth: 0 }}
              />
              <TextField
                label="Seats / row"
                type="number"
                value={seatsPerRow}
                onChange={(e) => setSeatsPerRow(Number(e.target.value))}
                sx={{ flex: '1 1 160px', minWidth: 0 }}
              />
            </Stack>

            <Stack direction="row" spacing={1} alignItems="center">
              <Button
                variant="contained"
                color="secondary"
                onClick={async () => {
                  await createAircraft.mutateAsync({
                    model,
                    total_rows: rows,
                    seats_per_row: seatsPerRow,
                  })
                  await aircraftQuery.refetch()
                }}
                disabled={!canSubmit || busy}
              >
                Create aircraft
              </Button>
              {busy && <CircularProgress size={18} />}
            </Stack>
          </>
        )}

        {createAircraft.isSuccess && (
          <Alert severity="success">
            Aircraft created: <strong>{createAircraft.data.id}</strong>
          </Alert>
        )}
        {createAircraft.isError && <Alert severity="error">{(createAircraft.error as Error).message}</Alert>}
      </Stack>
    </Paper>
  )
}
