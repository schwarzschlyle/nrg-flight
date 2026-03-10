import AirlineSeatReclineNormalRoundedIcon from '@mui/icons-material/AirlineSeatReclineNormalRounded'
import EventSeatRoundedIcon from '@mui/icons-material/EventSeatRounded'
import { Box, Chip, Stack } from '@mui/material'
import { alpha } from '@mui/material/styles'

export function SeatLegend() {
  return (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Chip
        icon={<AirlineSeatReclineNormalRoundedIcon />}
        label="Available"
        size="small"
        variant="outlined"
      />
      <Chip
        icon={<EventSeatRoundedIcon />}
        label="Selected"
        size="small"
        sx={(t) => ({
          bgcolor: alpha(t.palette.primary.main, 0.08),
          border: `1px solid ${alpha(t.palette.primary.main, 0.4)}`,
          fontWeight: 800,
        })}
      />
      <Chip label="Booked" size="small" sx={(t) => ({ bgcolor: alpha(t.palette.text.primary, 0.08) })} />
      <Box sx={{ flex: 1 }} />
    </Stack>
  )
}
