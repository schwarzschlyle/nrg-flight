import { Box, Skeleton, Stack } from '@mui/material'
import { alpha } from '@mui/material/styles'

export function InspectorSkeleton() {
  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1.5} useFlexGap sx={{ flexWrap: { md: 'wrap' } }}>
        <Skeleton variant="rounded" height={56} sx={{ flex: '1 1 220px', borderRadius: 3 }} />
        <Skeleton variant="rounded" height={56} sx={{ flex: '1 1 260px', borderRadius: 3 }} />
        <Skeleton variant="rounded" height={56} sx={{ flex: '2 1 320px', borderRadius: 3 }} />
      </Stack>

      <Box
        sx={(t) => ({
          borderRadius: 4,
          p: { xs: 1.5, sm: 2 },
          bgcolor: alpha(t.palette.primary.main, 0.03),
          border: `1px dashed ${alpha(t.palette.primary.main, 0.35)}`,
        })}
      >
        <Stack spacing={1}>
          {Array.from({ length: 6 }, (_, row) => (
            <Stack key={row} direction="row" spacing={1} alignItems="center">
              <Skeleton variant="text" width={28} height={20} />
              <Skeleton variant="rounded" width={44} height={36} sx={{ borderRadius: 2.5 }} />
              <Skeleton variant="rounded" width={44} height={36} sx={{ borderRadius: 2.5 }} />
              <Skeleton variant="rounded" width={44} height={36} sx={{ borderRadius: 2.5 }} />
              <Skeleton variant="rounded" width={18} height={36} sx={{ borderRadius: 2.5 }} />
              <Skeleton variant="rounded" width={44} height={36} sx={{ borderRadius: 2.5 }} />
              <Skeleton variant="rounded" width={44} height={36} sx={{ borderRadius: 2.5 }} />
            </Stack>
          ))}
        </Stack>
      </Box>

      <Stack spacing={1}>
        <Skeleton variant="text" width={220} height={22} />
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 3 }} />
        ))}
      </Stack>
    </Stack>
  )
}
