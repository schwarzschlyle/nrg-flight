import { Alert, Button, Link, Stack, TextField } from '@mui/material'
import { useMemo, useState } from 'react'

import { ApiError } from '@/app/api/http'
import { useLoginMutation } from '@/app/auth/useLoginMutation'
import { useRegisterMutation } from '@/app/auth/useRegisterMutation'
import { navigate } from '@/app/router/navigation'
import { routes } from '@/app/router/routes'
import { AuthShell } from '@/pages/shared/components/AuthShell/organisms/AuthShell'

export default function RegisterPage() {
  const register = useRegisterMutation()
  const login = useLoginMutation()

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const errorMsg = useMemo(() => {
    const err = (register.error ?? login.error) as unknown
    if (!err) return null

    if (err instanceof ApiError && err.status === 409) return 'This email is already registered. Please sign in.'
    return (err as Error).message
  }, [login.error, register.error])

  const busy = register.isPending || login.isPending

  return (
    <AuthShell
      title="Create your account"
      subtitle="Register once, then you can book flights instantly."
      aside={
        <Stack alignItems="center">
          <Link
            component="button"
            onClick={() => navigate(routes.login)}
            underline="hover"
            sx={{ fontWeight: 700 }}
          >
            Already have an account? Sign in
          </Link>
        </Stack>
      }
    >
      {errorMsg && <Alert severity="error">{errorMsg}</Alert>}
      {register.isSuccess && <Alert severity="success">Account created. Signing you in…</Alert>}

      <Stack spacing={1.75}>
        <TextField
          label="Full name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          fullWidth
        />
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
          autoComplete="new-password"
          helperText="Minimum 8 characters"
          fullWidth
        />
      </Stack>

      <Button
        variant="contained"
        size="large"
        disabled={busy || !fullName || !email || password.length < 8}
        onClick={async () => {
          await register.mutateAsync({ email, password, full_name: fullName })
          await login.mutateAsync({ email, password })
          navigate(routes.booking, { replace: true })
        }}
      >
        Create account
      </Button>
    </AuthShell>
  )
}
