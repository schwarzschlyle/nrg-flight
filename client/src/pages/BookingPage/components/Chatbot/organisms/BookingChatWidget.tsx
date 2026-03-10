import SendRoundedIcon from '@mui/icons-material/SendRounded'
import { Box, Button, CircularProgress, Divider, Paper, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { useEffect, useRef, useState } from 'react'

import { useAuth } from '@/app/auth/useAuth'

import { ChatFabButton } from '@/pages/BookingPage/components/Chatbot/atoms/ChatFabButton'
import { ChatTranscript } from '@/pages/BookingPage/components/Chatbot/molecules/ChatTranscript'
import { streamChat } from '@/pages/BookingPage/components/Chatbot/api/streamChat'
import type { ChatMsg, PendingBooking } from '@/pages/BookingPage/components/Chatbot/chatbot.types'

export function BookingChatWidget() {
  const { token } = useAuth()

  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [pendingBooking, setPendingBooking] = useState<PendingBooking>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  const abortRef = useRef<AbortController | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [messages, open])

  useEffect(() => () => abortRef.current?.abort(), [])

  const send = async () => {
    const text = input.trim()
    if (!text || busy) return

    abortRef.current?.abort()
    abortRef.current = new AbortController()

    setBusy(true)
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '' }])

    try {
      await streamChat({
        message: text,
        history: messages,
        pendingBooking,
        token,
        signal: abortRef.current.signal,
        onDelta: (t) => {
          setMessages((prev) => {
            const next = [...prev]
            const idx = next.length - 1
            if (!next[idx] || next[idx].role !== 'assistant') next.push({ role: 'assistant', content: '' })
            next[idx] = { role: 'assistant', content: (next[idx].content ?? '') + t }
            return next
          })
        },
        onState: setPendingBooking,
      })
    } catch (e) {
      setMessages((prev) => {
        const next = [...prev]
        const idx = next.length - 1
        if (next[idx]?.role === 'assistant' && !next[idx].content) {
          next[idx] = { role: 'assistant', content: (e as Error).message }
          return next
        }
        return [...next, { role: 'assistant', content: (e as Error).message }]
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box
      sx={{
        position: 'fixed',
        right: 16,
        bottom: 16,
        zIndex: 1400,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      {open && (
        <Paper
          elevation={0}
          sx={(t) => ({
            width: { xs: 320, sm: 360 },
            height: 420,
            borderRadius: 4,
            border: `1px solid ${alpha(t.palette.divider, 0.9)}`,
            bgcolor: alpha(t.palette.background.paper, 0.98),
            overflow: 'hidden',
          })}
        >
          <Stack height="100%">
            <Stack px={2} py={1.5} spacing={0.25}>
              <Typography fontWeight={950}>Chat assistant</Typography>
              <Typography variant="caption" color="text.secondary">
                Feel free to ask about available flights, seat availability, or book a seat at a specific time!
              </Typography>
            </Stack>

            <Divider />

            <Box ref={scrollRef} sx={{ px: 2, py: 1.5, flex: 1, overflowY: 'auto' }}>
              <ChatTranscript messages={messages} />
            </Box>

            <Divider />

            <Stack direction="row" spacing={1} px={2} py={1.5} alignItems="center">
              <TextField
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={busy ? 'Thinking…' : 'Type a message'}
                size="small"
                fullWidth
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    void send()
                  }
                }}
              />
              <Button
                variant="contained"
                onClick={() => void send()}
                disabled={busy || input.trim().length === 0}
                sx={{ minWidth: 44, px: 0, borderRadius: 999 }}
              >
                {busy ? <CircularProgress size={18} color="inherit" /> : <SendRoundedIcon fontSize="small" />}
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      <ChatFabButton open={open} onClick={() => setOpen((v) => !v)} />
    </Box>
  )
}
