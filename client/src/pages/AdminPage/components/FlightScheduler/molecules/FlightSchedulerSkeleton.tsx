import { Skeleton, Stack } from '@mui/material'

export function FlightSchedulerSkeleton() {
  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: { md: 'wrap' } }}>
        <Skeleton variant="rounded" height={56} sx={{ flex: '1 1 220px', borderRadius: 3 }} />
        <Skeleton variant="rounded" height={56} sx={{ flex: '2 1 280px', borderRadius: 3 }} />
        <Skeleton variant="rounded" height={56} sx={{ flex: '1 1 160px', borderRadius: 3 }} />
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Skeleton variant="rounded" width={140} height={40} sx={{ borderRadius: 999 }} />
        <Skeleton variant="circular" width={18} height={18} />
      </Stack>
    </Stack>
  )
}
