import { Alert, Button, Link, Stack, TextField } from '@mui/material'
import { useMemo, useState } from 'react'

import { ApiError } from '@/app/api/http'
import { useLoginMutation } from '@/app/auth/useLoginMutation'
import { navigate } from '@/app/router/navigation'
import { routes } from '@/app/router/routes'
import { AuthShell } from '@/pages/shared/components/AuthShell/organisms/AuthShell'

export default function LoginPage() {
  const login = useLoginMutation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const errorMsg = useMemo(() => {
    if (!login.isError) return null
    const err = login.error
    if (err instanceof ApiError && err.status === 401) return 'Invalid email or password.'
    return (err as Error).message
  }, [login.error, login.isError])

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to book flights and manage your itinerary."
      aside={
        <Stack alignItems="center">
          <Link
            component="button"
            onClick={() => navigate(routes.register)}
            underline="hover"
            sx={{ fontWeight: 700 }}
          >
            Create an account
          </Link>
        </Stack>
      }
    >
      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

      <Stack spacing={1.75}>
        <TextField
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          fullWidth
        />
        <TextField
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          autoComplete="current-password"
          fullWidth
        />
      </Stack>

      <Button
        variant="contained"
        size="large"
        onClick={async () => {
          await login.mutateAsync({ email, password })
          navigate(routes.booking, { replace: true })
        }}
        disabled={login.isPending || !email || !password}
      >
        Sign in
      </Button>

      <Button variant="text" onClick={() => navigate(routes.test)} sx={{ alignSelf: 'center' }}>
        Open Test Page
      </Button>
    </AuthShell>
  )
}
