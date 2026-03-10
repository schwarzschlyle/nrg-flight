import { Skeleton, Stack } from '@mui/material'

export function AircraftCreatorSkeleton() {
  return (
    <Stack spacing={1.5}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} useFlexGap sx={{ flexWrap: { sm: 'wrap' } }}>
        <Skeleton variant="rounded" height={56} sx={{ flex: '2 1 260px', borderRadius: 3 }} />
        <Skeleton variant="rounded" height={56} sx={{ flex: '1 1 120px', borderRadius: 3 }} />
        <Skeleton variant="rounded" height={56} sx={{ flex: '1 1 160px', borderRadius: 3 }} />
      </Stack>
      <Stack direction="row" spacing={1} alignItems="center">
        <Skeleton variant="rounded" width={160} height={40} sx={{ borderRadius: 999 }} />
        <Skeleton variant="circular" width={18} height={18} />
      </Stack>
    </Stack>
  )
}
