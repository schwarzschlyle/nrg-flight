import { Box, Container, Paper, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import type { PropsWithChildren, ReactNode } from 'react'

import { theme } from '@/app/theme/theme'

type Props = PropsWithChildren<{
  title: string
  subtitle: string
  aside?: ReactNode
}>

export function AuthShell({ title, subtitle, aside, children }: Props) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        py: 5,
        background: `radial-gradient(1000px 500px at 0% 0%, ${alpha(theme.palette.primary.main, 0.16)}, transparent 55%), radial-gradient(900px 450px at 100% 20%, ${alpha(theme.palette.secondary.main, 0.18)}, transparent 60%)`,
      }}
    >
      <Container maxWidth="sm">
        <Stack spacing={2.5}>
          <Stack spacing={0.5} alignItems="center" textAlign="center">
            <Typography variant="h4" fontWeight={900}>
              {title}
            </Typography>
            <Typography color="text.secondary">{subtitle}</Typography>
          </Stack>

          <Paper
            elevation={0}
            sx={(t) => ({
              borderRadius: 4,
              p: { xs: 2.5, sm: 3 },
              border: `1px solid ${t.palette.divider}`,
              bgcolor: alpha(t.palette.background.paper, 0.92),
              backdropFilter: 'blur(10px)',
            })}
          >
            <Stack spacing={2}>{children}</Stack>
          </Paper>

          {aside}
        </Stack>
      </Container>
    </Box>
  )
}
