import { Box, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'

type Role = 'user' | 'assistant'

type Props = {
  role: Role
  content: string
}

export function ChatMessageBubble({ role, content }: Props) {
  const isUser = role === 'user'

  return (
    <Box
      sx={(t) => ({
        alignSelf: isUser ? 'flex-end' : 'flex-start',
        maxWidth: '86%',
        px: 1.25,
        py: 1,
        borderRadius: 3,
        bgcolor: isUser ? alpha(t.palette.primary.main, 0.12) : alpha(t.palette.divider, 0.28),
        border: `1px solid ${alpha(isUser ? t.palette.primary.main : t.palette.divider, isUser ? 0.22 : 0.55)}`,
        whiteSpace: 'pre-wrap',
      })}
    >
      <Typography variant="body2" sx={{ lineHeight: 1.35 }}>
        {content}
      </Typography>
    </Box>
  )
}
