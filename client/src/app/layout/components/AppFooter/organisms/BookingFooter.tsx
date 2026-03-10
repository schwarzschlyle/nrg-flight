import { Box, Container, Divider, Stack, Typography } from '@mui/material'

const info = [
  {
    title: 'Check-in',
    detail: 'Check-in opens 24 hours before departure',
  },
  {
    title: 'Baggage',
    detail: '1 carry-on + 1 checked bag included',
  },
  {
    title: 'Cancellation',
    detail: 'Free cancellation up to 24 hours before departure',
  },
] as const

export function BookingFooter() {
  return (
    <Box component="footer" sx={{ mt: 6, pb: 5 }}>
      <Container maxWidth="lg">
        <Divider sx={{ mb: 3 }} />
        <Stack spacing={1.25}>
          <Typography variant="subtitle1" fontWeight={900}>
            Important Information
          </Typography>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2.5}>
            {info.map((i) => (
              <Box
                key={i.title}
                sx={(t) => ({
                  flex: 1,
                  p: 2,
                  borderRadius: 3,
                  bgcolor: t.palette.background.paper,
                  border: `1px solid ${t.palette.divider}`,
                })}
              >
                <Typography fontWeight={800}>{i.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {i.detail}
                </Typography>
              </Box>
            ))}
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ pt: 1.5 }}>
            © {new Date().getFullYear()} NRG Flight. Schedules and gates are subject to change.
          </Typography>
        </Stack>
      </Container>
    </Box>
  )
}
