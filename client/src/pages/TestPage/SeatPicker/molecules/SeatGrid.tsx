import { Box, Typography } from '@mui/material'

import { SeatButton } from '@/pages/TestPage/SeatPicker/atoms/SeatButton'
import type { SeatResponse } from '@/types/api/seat'

type Props = {
  seats: SeatResponse[]
  selectedSeatId: string | null
  onSelectSeatId: (seatId: string) => void
  interactive?: boolean
}

export function SeatGrid({ seats, selectedSeatId, onSelectSeatId, interactive = true }: Props) {
  const rows = seats.reduce<Record<number, SeatResponse[]>>((acc, seat) => {
    const key = seat.row_number
    acc[key] = acc[key] ? [...acc[key], seat] : [seat]
    return acc
  }, {})

  const sortedRowNumbers = Object.keys(rows)
    .map((n) => Number(n))
    .sort((a, b) => a - b)

  return (
    <Box display="grid" gap={1.25}>
      {sortedRowNumbers.map((rowNumber) => (
        <Box key={rowNumber} display="grid" gridTemplateColumns="64px 1fr" alignItems="center" gap={1}>
          <Typography variant="body2" color="text.secondary">
            Row {rowNumber}
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {rows[rowNumber]
              .slice()
              .sort((a, b) => a.seat_letter.localeCompare(b.seat_letter))
              .map((seat) => (
                <SeatButton
                  key={seat.seat_id}
                  label={seat.seat_code}
                  disabled={!interactive || seat.is_booked}
                  selected={seat.seat_id === selectedSeatId}
                  onClick={interactive ? () => onSelectSeatId(seat.seat_id) : undefined}
                />
              ))}
          </Box>
        </Box>
      ))}
    </Box>
  )
}
