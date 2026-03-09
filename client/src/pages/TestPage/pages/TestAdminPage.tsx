import { Divider, Stack, Typography } from '@mui/material'

import { AdminSetupPanel } from '@/pages/TestPage/AdminSetup/organisms/AdminSetupPanel'
import { FlightInspectorPanel } from '@/pages/TestPage/admin/FlightInspector/organisms/FlightInspectorPanel'

export function TestAdminPage() {
  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h6">Flight management</Typography>
        <Typography variant="body2" color="text.secondary">
          Create aircrafts and register flights on them.
        </Typography>
      </Stack>

      <AdminSetupPanel />
      <Divider />
      <FlightInspectorPanel />
    </Stack>
  )
}
