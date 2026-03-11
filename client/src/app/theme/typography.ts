import type { ThemeOptions } from '@mui/material/styles'

// MUI type exports have shifted between major versions; ThemeOptions is stable.
export const typography: NonNullable<ThemeOptions['typography']> = {
  fontFamily: [
    'system-ui',
    '-apple-system',
    'BlinkMacSystemFont',
    'Segoe UI',
    'Roboto',
    'Arial',
    'sans-serif',
  ].join(','),
  h1: {
    fontWeight: 700,
    letterSpacing: -0.6,
  },
  h2: {
    fontWeight: 700,
    letterSpacing: -0.4,
  },
  h3: {
    fontWeight: 700,
    letterSpacing: -0.2,
  },
  h4: {
    fontWeight: 700,
    letterSpacing: -0.2,
  },
  h5: {
    fontWeight: 700,
  },
  h6: {
    fontWeight: 700,
  },
  button: {
    textTransform: 'none',
    fontWeight: 700,
  },
}
