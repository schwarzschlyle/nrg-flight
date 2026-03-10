import { Stack, Typography } from '@mui/material'

import { ChatMessageBubble } from '@/pages/BookingPage/components/Chatbot/atoms/ChatMessageBubble'

import type { ChatMsg } from '@/pages/BookingPage/components/Chatbot/chatbot.types'

type Props = {
  messages: ChatMsg[]
}

export function ChatTranscript({ messages }: Props) {
  if (messages.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Ask about available flights, seat availability, or say “Book seat 12A for tomorrow 10:00”.
      </Typography>
    )
  }

  return (
    <Stack spacing={1}>
      {messages.map((m, idx) => (
        <ChatMessageBubble key={idx} role={m.role} content={m.content} />
      ))}
    </Stack>
  )
}

