import { Button } from '@mui/material'

type Props = {
  label: string
  disabled?: boolean
  selected?: boolean
  onClick?: () => void
}

export function SeatButton({ label, disabled, selected, onClick }: Props) {
  return (
    <Button
      variant={selected ? 'contained' : 'outlined'}
      color={selected ? 'primary' : 'inherit'}
      size="small"
      disabled={disabled}
      onClick={onClick}
      sx={{ minWidth: 56 }}
    >
      {label}
    </Button>
  )
}
