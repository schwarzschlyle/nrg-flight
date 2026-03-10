import { Box, Stack, Typography } from '@mui/material'

import type { SeatResponse } from '@/types/api/seat'

import { SeatCell } from '../atoms/SeatCell'

type Props = {
  seats: SeatResponse[]
  selectedSeatId: string | null
  onSelectSeatId: (seatId: string) => void
  interactive?: boolean
}

export function SeatMap({ seats, selectedSeatId, onSelectSeatId, interactive = true }: Props) {
  const rows = seats.reduce<Record<number, SeatResponse[]>>((acc, seat) => {
    const key = seat.row_number
    acc[key] = acc[key] ? [...acc[key], seat] : [seat]
    return acc
  }, {})

  const sortedRowNumbers = Object.keys(rows)
    .map((n) => Number(n))
    .sort((a, b) => a - b)

  return (
    <Stack spacing={1.25}>
      {sortedRowNumbers.map((rowNumber) => {
        const rowSeats = rows[rowNumber]
          .slice()
          .sort((a, b) => a.seat_letter.localeCompare(b.seat_letter))

        const splitIndex = Math.ceil(rowSeats.length / 2)
        const left = rowSeats.slice(0, splitIndex)
        const right = rowSeats.slice(splitIndex)

        return (
          <Box
            key={rowNumber}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '44px 1fr', sm: '56px 1fr' },
              alignItems: 'center',
              columnGap: 1.5,
              rowGap: 1,
            }}
          >
            <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 800 }}>
              {rowNumber}
            </Typography>
            <Box display="flex" alignItems="center" gap={1.25} flexWrap="wrap">
              <Box display="flex" gap={1}>
                {left.map((seat) => (
                  <SeatCell
                    key={seat.seat_id}
                    label={seat.seat_code}
                    state={
                      seat.is_booked
                        ? 'booked'
                        : seat.seat_id === selectedSeatId
                          ? 'selected'
                          : 'available'
                    }
                    onClick={
                      interactive && !seat.is_booked
                        ? () => onSelectSeatId(seat.seat_id)
                        : undefined
                    }
                  />
                ))}
              </Box>
              {right.length > 0 && <Box sx={{ width: { xs: 14, sm: 18 } }} />}
              <Box display="flex" gap={1}>
                {right.map((seat) => (
                  <SeatCell
                    key={seat.seat_id}
                    label={seat.seat_code}
                    state={
                      seat.is_booked
                        ? 'booked'
                        : seat.seat_id === selectedSeatId
                          ? 'selected'
                          : 'available'
                    }
                    onClick={
                      interactive && !seat.is_booked
                        ? () => onSelectSeatId(seat.seat_id)
                        : undefined
                    }
                  />
                ))}
              </Box>
            </Box>
          </Box>
        )
      })}
    </Stack>
  )
}
