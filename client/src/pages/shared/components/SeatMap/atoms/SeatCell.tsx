import { Box, ButtonBase, Tooltip, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

export type SeatCellState = 'available' | 'selected' | 'booked'

type Props = {
  label: string
  state: SeatCellState
  onClick?: () => void
}

export function SeatCell({ label, state, onClick }: Props) {
  const disabled = state === 'booked' || !onClick

  return (
    <Tooltip title={state === 'booked' ? 'Booked' : label} arrow disableInteractive>
      <Box>
        <ButtonBase
          disabled={disabled}
          onClick={onClick}
          sx={(t) => {
            const isSelected = state === 'selected'
            const isBooked = state === 'booked'

            return {
              width: { xs: 40, sm: 44 },
              height: { xs: 34, sm: 36 },
              borderRadius: 2.5,
              border: `1px solid ${isSelected ? t.palette.primary.main : alpha(t.palette.divider, 0.9)}`,
              bgcolor: isSelected
                ? t.palette.primary.main
                : isBooked
                  ? alpha(t.palette.text.primary, 0.08)
                  : t.palette.background.paper,
              color: isSelected
                ? t.palette.primary.contrastText
                : isBooked
                  ? alpha(t.palette.text.primary, 0.4)
                  : t.palette.text.primary,
              transition: 'transform 120ms ease, background-color 120ms ease, border-color 120ms ease',
              '&:hover': disabled
                ? undefined
                : {
                    transform: 'translateY(-1px)',
                    bgcolor: alpha(t.palette.primary.main, 0.08),
                    borderColor: alpha(t.palette.primary.main, 0.6),
                  },
            }
          }}
        >
          <Typography variant="caption" fontWeight={900}>
            {label}
          </Typography>
        </ButtonBase>
      </Box>
    </Tooltip>
  )
}
