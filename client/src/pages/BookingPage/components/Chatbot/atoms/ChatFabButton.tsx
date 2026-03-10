import ChatRoundedIcon from '@mui/icons-material/ChatRounded'
import { IconButton, Tooltip } from '@mui/material'
import { alpha } from '@mui/material/styles'

type Props = {
  open: boolean
  onClick: () => void
}

export function ChatFabButton({ open, onClick }: Props) {
  return (
    <Tooltip title={open ? 'Close chat' : 'Chat'} placement="left">
      <IconButton
        onClick={onClick}
        color={open ? 'secondary' : 'primary'}
        sx={(t) => ({
          width: 46,
          height: 46,
          borderRadius: 999,
          border: `1px solid ${alpha(open ? t.palette.secondary.main : t.palette.primary.main, 0.35)}`,
          bgcolor: alpha(open ? t.palette.secondary.main : t.palette.primary.main, open ? 0.08 : 0.06),
          '&:hover': {
            bgcolor: alpha(open ? t.palette.secondary.main : t.palette.primary.main, open ? 0.12 : 0.1),
          },
        })}
      >
        <ChatRoundedIcon fontSize="small" />
      </IconButton>
    </Tooltip>
  )
}
