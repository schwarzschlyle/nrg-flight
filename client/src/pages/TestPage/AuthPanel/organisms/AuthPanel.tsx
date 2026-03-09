import { Alert, Button, Divider, Stack, TextField, Typography } from '@mui/material'

import { ApiError } from '@/app/api/http'
import { useLoginMutation } from '@/pages/TestPage/api/mutations/useLoginMutation'
import { useRegisterMutation } from '@/pages/TestPage/api/mutations/useRegisterMutation'
import { useAppStore } from '@/store'
import type { RootStore } from '@/store/store.types'

export function AuthPanel() {
  const accessToken = useAppStore((s: RootStore) => s.auth.accessToken)
  const setAccessToken = useAppStore((s: RootStore) => s.setAccessToken)
  const { userEmail, userPassword, userFullName } = useAppStore((s: RootStore) => s.testPage)
  const setTestPage = useAppStore((s: RootStore) => s.setTestPage)
  const login = useLoginMutation()
  const register = useRegisterMutation()

  return (
    <Stack spacing={2}>
      <Typography variant="h6">Authentication</Typography>
      <Typography variant="body2" color="text.secondary">
        Login is required for all booking endpoints (JWT Bearer token).
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <TextField
          label="Email"
          value={userEmail}
          onChange={(e) => setTestPage({ userEmail: e.target.value })}
          autoComplete="email"
          sx={{ minWidth: 280 }}
        />
        <TextField
          label="Password"
          value={userPassword}
          onChange={(e) => setTestPage({ userPassword: e.target.value })}
          type="password"
          autoComplete="current-password"
          sx={{ minWidth: 220 }}
        />
      </Stack>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
        <TextField
          label="Full name"
          value={userFullName}
          onChange={(e) => setTestPage({ userFullName: e.target.value })}
          sx={{ minWidth: 280 }}
        />
        <Button
          variant="outlined"
          onClick={async () => {
            try {
              await register.mutateAsync({ email: userEmail, password: userPassword, full_name: userFullName })
            } catch (e) {
              if (e instanceof ApiError && e.status === 409) {
                register.reset()
              }
            }
          }}
          disabled={register.isPending}
        >
          Register
        </Button>
        <Button
          variant="contained"
          onClick={() => login.mutate({ email: userEmail, password: userPassword })}
          disabled={login.isPending}
        >
          Login
        </Button>
        <Button variant="text" onClick={() => setAccessToken(null)} disabled={!accessToken}>
          Clear token
        </Button>
      </Stack>

      <Divider />

      {accessToken && <Alert severity="success">Access token loaded. You can now call protected endpoints.</Alert>}
      {(register.isError || login.isError) && (
        <Alert severity="error">{((register.error ?? login.error) as Error).message}</Alert>
      )}
    </Stack>
  )
}
