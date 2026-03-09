import { Container, Stack, Typography } from '@mui/material'

import { TestTabs } from '@/pages/TestPage/components/TestTabs/organisms/TestTabs'

export default function TestPage() {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Stack spacing={0.5}>
          <Typography variant="h4">Ticketing Test Page</Typography>
          <Typography variant="body2" color="text.secondary">
            End-to-end test UI for flight admin + booking.
          </Typography>
        </Stack>

        <TestTabs />
      </Stack>
    </Container>
  )
}
