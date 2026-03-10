import CalendarMonthRoundedIcon from '@mui/icons-material/CalendarMonthRounded'
import { InputAdornment, TextField } from '@mui/material'

type Props = {
  value: string
  onChange: (value: string) => void
}

export function DatePickerField({ value, onChange }: Props) {
  return (
    <TextField
      label="Departure date"
      type="date"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      InputLabelProps={{ shrink: true }}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start">
            <CalendarMonthRoundedIcon fontSize="small" />
          </InputAdornment>
        ),
      }}
      sx={{ width: { xs: '100%', sm: 260 } }}
    />
  )
}
