import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded'
import LogoutRoundedIcon from '@mui/icons-material/LogoutRounded'
import { Divider, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Tooltip, Typography } from '@mui/material'
import { useState } from 'react'

import { useLogout } from '@/app/auth/useLogout'
import { useAuth } from '@/app/auth/useAuth'
import { navigate } from '@/app/router/navigation'
import { routes } from '@/app/router/routes'

export function UserMenu() {
  const { account } = useAuth()
  const logout = useLogout()

  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = Boolean(anchorEl)

  const name = account?.full_name ?? 'Guest'
  const email = account?.email ?? ''

  return (
    <>
      <Tooltip title={account ? `Signed in as ${name}` : 'Account'}>
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} size="small" sx={{ ml: 1 }}>
          <AccountCircleRoundedIcon />
        </IconButton>
      </Tooltip>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        slotProps={{ paper: { sx: { width: 280, borderRadius: 3, overflow: 'hidden' } } }}
      >
        <MenuItem disabled>
          <ListItemText
            primary={<Typography fontWeight={800}>{name}</Typography>}
            secondary={email}
            secondaryTypographyProps={{ noWrap: true }}
          />
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={async () => {
            setAnchorEl(null)
            await logout.mutateAsync()
            navigate(routes.login, { replace: true })
          }}
          disabled={logout.isPending}
        >
          <ListItemIcon>
            <LogoutRoundedIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Log out</ListItemText>
        </MenuItem>
      </Menu>
    </>
  )
}
