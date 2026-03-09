import { Alert, Box, Button, CircularProgress, MenuItem, Stack, TextField, Typography } from '@mui/material'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { useAdminLoginMutation } from '@/pages/TestPage/api/mutations/useAdminLoginMutation'
import { useCreateAircraftMutation } from '@/pages/TestPage/api/mutations/useCreateAircraftMutation'
import { useCreateFlightMutation } from '@/pages/TestPage/api/mutations/useCreateFlightMutation'
import { useRegisterMutation } from '@/pages/TestPage/api/mutations/useRegisterMutation'
import { ApiError } from '@/app/api/http'
import { useAircraftQuery } from '@/pages/TestPage/api/queries/useAircraftQuery'
import { useAppStore } from '@/store'
import type { RootStore } from '@/store/store.types'

export function AdminSetupPanel() {
  const queryClient = useQueryClient()
  const adminAccessToken = useAppStore((s: RootStore) => s.auth.adminAccessToken)
  const aircraftQuery = useAircraftQuery()
  const { adminEmail, adminPassword, adminFullName, aircraftModel, aircraftRows, aircraftSeatsPerRow, aircraftId, adminDepartureDate, adminTimeSlotId } = useAppStore(
    (s: RootStore) => s.testPage,
  )
  const setTestPage = useAppStore((s: RootStore) => s.setTestPage)

  useEffect(() => {
    const ids = (aircraftQuery.data ?? []).map((a) => a.id)
    if (ids.length === 0) return

    if (aircraftId && !ids.includes(aircraftId)) {
      setTestPage({ aircraftId: null })
      return
    }

    if (!aircraftId) setTestPage({ aircraftId: ids[0] })
  }, [aircraftId, aircraftQuery.data, setTestPage])

  const register = useRegisterMutation()
  const adminLogin = useAdminLoginMutation()
  const createAircraft = useCreateAircraftMutation()
  const createFlight = useCreateFlightMutation()

  const onRegisterAdmin = async () => {
    try {
      await register.mutateAsync({ email: adminEmail, password: adminPassword, full_name: adminFullName })
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        register.reset()
      }
    }
  }

  const onLoginAdmin = async () => {
    await adminLogin.mutateAsync({ email: adminEmail, password: adminPassword })
  }

  const onCreateAircraft = async () => {
    const a = await createAircraft.mutateAsync({
      model: aircraftModel,
      total_rows: aircraftRows,
      seats_per_row: aircraftSeatsPerRow,
    })
    setTestPage({ aircraftId: a.id })
    await aircraftQuery.refetch()
  }

  const onCreateFlight = async () => {
    if (!aircraftId) return
    const flight = await createFlight.mutateAsync({
      time_slot_id: adminTimeSlotId,
      aircraft_id: aircraftId,
      departure_date: adminDepartureDate,
    })

    // Refresh slot list (used by SlotPickerPanel).
    await queryClient.invalidateQueries({ queryKey: ['slots', adminDepartureDate] })
    await aircraftQuery.refetch()
    return flight
  }

  const busy =
    register.isPending || adminLogin.isPending || createAircraft.isPending || createFlight.isPending

  return (
    <Stack spacing={2}>
      <Box>
        <Typography variant="h6">Admin setup</Typography>
        <Typography variant="body2" color="text.secondary">
          Create an aircraft + a flight (and seat rows) so users can book seats.
        </Typography>
      </Box>

      <Stack spacing={1.5}>
        <Typography variant="subtitle2">Admin auth</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            label="Admin email"
            value={adminEmail}
            onChange={(e) => {
              setTestPage({ adminEmail: e.target.value })
            }}
            sx={{ minWidth: 260 }}
          />
          <TextField
            label="Admin password"
            type="password"
            value={adminPassword}
            onChange={(e) => {
              setTestPage({ adminPassword: e.target.value })
            }}
            sx={{ minWidth: 220 }}
          />
          <TextField
            label="Full name"
            value={adminFullName}
            onChange={(e) => setTestPage({ adminFullName: e.target.value })}
            sx={{ minWidth: 200 }}
          />
        </Stack>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
          <Button variant="outlined" onClick={() => void onRegisterAdmin()} disabled={busy}>
            Register admin
          </Button>
          <Button variant="contained" onClick={() => void onLoginAdmin()} disabled={busy}>
            Login admin
          </Button>
          {busy && <CircularProgress size={20} />}
        </Stack>
        {adminAccessToken && <Alert severity="success">Admin JWT loaded.</Alert>}
        {(register.isError || adminLogin.isError) && (
          <Alert severity="error">{((register.error ?? adminLogin.error) as Error).message}</Alert>
        )}
      </Stack>

      <Stack spacing={1.5}>
        <Typography variant="subtitle2">Create aircraft</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            label="Model"
            value={aircraftModel}
            onChange={(e) => setTestPage({ aircraftModel: e.target.value })}
            sx={{ minWidth: 260 }}
          />
          <TextField
            label="Rows"
            type="number"
            value={aircraftRows}
            onChange={(e) => setTestPage({ aircraftRows: Number(e.target.value) })}
            sx={{ width: 120 }}
          />
          <TextField
            label="Seats / row"
            type="number"
            value={aircraftSeatsPerRow}
            onChange={(e) => setTestPage({ aircraftSeatsPerRow: Number(e.target.value) })}
            sx={{ width: 140 }}
          />
          <Button variant="contained" onClick={() => void onCreateAircraft()} disabled={!adminAccessToken || busy}>
            Create aircraft
          </Button>
        </Stack>
        {aircraftId && <Alert severity="success">Aircraft created: {aircraftId}</Alert>}
        {createAircraft.isError && <Alert severity="error">{(createAircraft.error as Error).message}</Alert>}
      </Stack>

      <Stack spacing={1.5}>
        <Typography variant="subtitle2">Create flight (for selected date)</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            label="Departure date"
            type="date"
            value={adminDepartureDate}
            onChange={(e) => setTestPage({ adminDepartureDate: e.target.value })}
            InputLabelProps={{ shrink: true }}
            sx={{ width: 220 }}
          />
          <TextField
            label="Aircraft"
            select
            value={aircraftId ?? ''}
            onChange={(e) => setTestPage({ aircraftId: e.target.value || null })}
            disabled={aircraftQuery.isLoading || aircraftQuery.isError}
            sx={{ minWidth: 320 }}
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
          <TextField
            label="Slot ID (0-23)"
            type="number"
            value={adminTimeSlotId}
            onChange={(e) => setTestPage({ adminTimeSlotId: Number(e.target.value) })}
            sx={{ width: 160 }}
          />
          <Button
            variant="contained"
            onClick={() => void onCreateFlight()}
            disabled={!adminAccessToken || !aircraftId || busy}
          >
            Create flight
          </Button>
        </Stack>

        {createFlight.isSuccess && (
          <Alert severity="success">
            Flight created: <strong>{createFlight.data.flight_number}</strong> (Gate {createFlight.data.gate})
          </Alert>
        )}
        {createFlight.isError && <Alert severity="error">{(createFlight.error as Error).message}</Alert>}

        {createFlight.isError && (createFlight.error as Error).message.includes('Failed to fetch') && (
          <Alert severity="warning">
            Network error: failed to reach the API. Check `VITE_API_BASE_URL`, that the API server is running, and CORS.
          </Alert>
        )}

        {createFlight.isSuccess && (
          <Alert severity="info">
            Tip: After creating a flight, re-open the slot dropdown. Slots show available/total seats.
          </Alert>
        )}
      </Stack>
    </Stack>
  )
}
