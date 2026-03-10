import AdminPanelSettingsRoundedIcon from '@mui/icons-material/AdminPanelSettingsRounded'
import FlightTakeoffRoundedIcon from '@mui/icons-material/FlightTakeoffRounded'
import { AppBar, Box, Button, Container, Stack, Toolbar, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

import { useAuth } from '@/app/auth/useAuth'
import { navigate } from '@/app/router/navigation'
import { routes } from '@/app/router/routes'

import { UserMenu } from '../molecules/UserMenu'

type Props = {
  active: 'booking' | 'admin' | null
}

export function AppHeader({ active }: Props) {
  const { isAdmin } = useAuth()

  return (
    <AppBar
      position="sticky"
      sx={(t) => ({
        borderBottom: `1px solid ${alpha(t.palette.divider, 0.6)}`,
        backdropFilter: 'blur(14px)',
        bgcolor: alpha(t.palette.background.paper, 0.84),
      })}
    >
      <Toolbar disableGutters>
        <Container maxWidth="lg">
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.25}>
              <Box
                sx={(t) => ({
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  bgcolor: alpha(t.palette.primary.main, 0.12),
                  display: 'grid',
                  placeItems: 'center',
                })}
              >
                <FlightTakeoffRoundedIcon color="primary" />
              </Box>
              <Typography fontWeight={900} letterSpacing={-0.3}>
                NRG Flight
              </Typography>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                size="small"
                variant={active === 'booking' ? 'contained' : 'text'}
                onClick={() => navigate(routes.booking)}
              >
                Booking
              </Button>

              {isAdmin && (
                <Button
                  size="small"
                  startIcon={<AdminPanelSettingsRoundedIcon />}
                  variant={active === 'admin' ? 'contained' : 'outlined'}
                  onClick={() => navigate(routes.admin)}
                >
                  Admin
                </Button>
              )}

              <UserMenu />
            </Stack>
          </Stack>
        </Container>
      </Toolbar>
    </AppBar>
  )
}
