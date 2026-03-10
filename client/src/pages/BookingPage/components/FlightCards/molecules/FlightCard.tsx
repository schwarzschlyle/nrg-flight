import AccessTimeRoundedIcon from '@mui/icons-material/AccessTimeRounded'
import AirlineSeatReclineNormalRoundedIcon from '@mui/icons-material/AirlineSeatReclineNormalRounded'
import ConfirmationNumberRoundedIcon from '@mui/icons-material/ConfirmationNumberRounded'
import DoorFrontRoundedIcon from '@mui/icons-material/DoorFrontRounded'
import { Box, ButtonBase, Chip, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import type { SlotResponse } from '@/types/api/flight'
import { formatTimeSlot } from '@/app/utils/timeSlots'

type Props = {
  slot: SlotResponse
  selected: boolean
  onSelect: () => void
}

export function FlightCard({ slot, selected, onSelect }: Props) {
  const disabled = !slot.flight_id || slot.available_seats === 0

  return (
    <ButtonBase
      disabled={disabled}
      onClick={onSelect}
      sx={(t) => ({
        width: '100%',
        textAlign: 'left',
        borderRadius: 4,
        p: 2,
        border: `1px solid ${selected ? alpha(t.palette.primary.main, 0.55) : alpha(t.palette.divider, 0.9)}`,
        bgcolor: selected ? alpha(t.palette.primary.main, 0.06) : t.palette.background.paper,
        transition: 'transform 140ms ease, border-color 140ms ease, background-color 140ms ease',
        '&:hover': disabled
          ? undefined
          : {
              transform: 'translateY(-2px)',
              borderColor: alpha(t.palette.primary.main, 0.55),
              bgcolor: alpha(t.palette.primary.main, 0.05),
            },
        '&.Mui-disabled': {
          opacity: 0.6,
        },
      })}
    >
      <Stack spacing={1.25} width="100%">
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1.5}>
          <Box>
            <Typography fontWeight={900}>
              {slot.flight_number} <Typography component="span" color="text.secondary" fontWeight={800}>
                • {slot.aircraft_model ?? 'Aircraft'}
              </Typography>
            </Typography>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" mt={0.75}>
              <Chip
                icon={<AccessTimeRoundedIcon />}
                label={formatTimeSlot(slot.slot_id, '24h')}
                size="small"
                variant="outlined"
              />
              <Chip
                icon={<DoorFrontRoundedIcon />}
                label={`Gate ${slot.gate}`}
                size="small"
                variant="outlined"
              />
            </Stack>
          </Box>

          {slot.flight_id ? (
            <Chip
              color={slot.available_seats === 0 ? 'default' : 'secondary'}
              icon={<AirlineSeatReclineNormalRoundedIcon />}
              label={`${slot.available_seats}/${slot.total_seats}`}
              size="small"
              sx={{ fontWeight: 800 }}
            />
          ) : (
            <Chip
              icon={<ConfirmationNumberRoundedIcon />}
              label="Not scheduled"
              size="small"
              variant="outlined"
            />
          )}
        </Stack>
        {disabled && (
          <Typography variant="caption" color="text.secondary">
            {slot.flight_id ? 'Sold out' : 'No active flight for this slot'}
          </Typography>
        )}
      </Stack>
    </ButtonBase>
  )
}
