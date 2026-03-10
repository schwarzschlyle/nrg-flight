import { Box, Skeleton, Stack } from '@mui/material'
import { alpha } from '@mui/material/styles'

type Props = {
  rows?: number
  seatsPerRow?: number
}

export function SeatMapSkeleton({ rows = 8, seatsPerRow = 6 }: Props) {
  const left = Math.ceil(seatsPerRow / 2)
  const right = Math.max(0, seatsPerRow - left)

  return (
    <Box
      sx={(t) => ({
        borderRadius: 4,
        p: { xs: 1.5, sm: 2 },
        bgcolor: alpha(t.palette.primary.main, 0.03),
        border: `1px dashed ${alpha(t.palette.primary.main, 0.35)}`,
      })}
    >
      <Stack spacing={1}>
        {Array.from({ length: rows }, (_, row) => (
          <Stack key={row} direction="row" spacing={1} alignItems="center" flexWrap="nowrap">
            <Skeleton variant="text" width={28} height={20} />

            <Stack direction="row" spacing={1} flexWrap="nowrap">
              {Array.from({ length: left }, (_, i) => (
                <Skeleton
                  key={`L-${row}-${i}`}
                  variant="rounded"
                  width={44}
                  height={36}
                  sx={{ borderRadius: 2.5 }}
                />
              ))}
            </Stack>

            {right > 0 && <Box sx={{ width: 18 }} />}

            <Stack direction="row" spacing={1} flexWrap="nowrap">
              {Array.from({ length: right }, (_, i) => (
                <Skeleton
                  key={`R-${row}-${i}`}
                  variant="rounded"
                  width={44}
                  height={36}
                  sx={{ borderRadius: 2.5 }}
                />
              ))}
            </Stack>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}
