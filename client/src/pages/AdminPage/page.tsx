import { Container, Stack, Typography } from '@mui/material'

import { AppHeader } from '@/app/layout/components/AppHeader/organisms/AppHeader'

import { AircraftCreatorPanel } from './components/AircraftCreator/organisms/AircraftCreatorPanel'
import { AdminFlightInspectorPanel } from './components/FlightInspector/organisms/AdminFlightInspectorPanel'
import { FlightSchedulerPanel } from './components/FlightScheduler/organisms/FlightSchedulerPanel'

export default function AdminPage() {
  return (
    <Stack minHeight="100vh">
      <AppHeader active="admin" />

      <Container maxWidth="lg" sx={{ py: { xs: 3, sm: 4 } }}>
        <Stack spacing={2.5}>
          <Stack spacing={0.75}>
            <Typography variant="h4" fontWeight={950} letterSpacing={-0.6}>
              Admin
            </Typography>
            <Typography color="text.secondary">
              Manage aircraft and publish daily flights.
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: 'column', lg: 'row' }}
            spacing={2.5}
            alignItems={{ lg: 'flex-start' }}
            sx={{ width: '100%' }}
          >
            <Stack spacing={2.5} flex={1} sx={{ minWidth: 0 }}>
              <AircraftCreatorPanel />
              <FlightSchedulerPanel />
            </Stack>

            <Stack flex={1.25} sx={{ minWidth: 0 }}>
              <AdminFlightInspectorPanel />
            </Stack>
          </Stack>
        </Stack>
      </Container>
    </Stack>
  )
}
