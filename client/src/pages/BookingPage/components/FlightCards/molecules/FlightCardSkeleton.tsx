import { Box, Skeleton, Stack } from '@mui/material'
import { alpha } from '@mui/material/styles'

export function FlightCardSkeleton() {
  return (
    <Box
      sx={(t) => ({
        width: '100%',
        borderRadius: 4,
        p: 2,
        border: `1px solid ${alpha(t.palette.divider, 0.9)}`,
        bgcolor: t.palette.background.paper,
      })}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
          <Stack spacing={1} flex={1}>
            <Skeleton variant="text" width="78%" height={26} />
            <Stack direction="row" spacing={1.25}>
              <Skeleton variant="rounded" width={92} height={24} sx={{ borderRadius: 999 }} />
              <Skeleton variant="rounded" width={76} height={24} sx={{ borderRadius: 999 }} />
            </Stack>
          </Stack>
          <Skeleton variant="rounded" width={72} height={28} sx={{ borderRadius: 999 }} />
        </Stack>
        <Skeleton variant="text" width="40%" height={18} />
      </Stack>
    </Box>
  )
}
