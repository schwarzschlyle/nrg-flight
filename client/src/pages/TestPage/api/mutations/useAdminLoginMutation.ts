import { useMutation } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import { useAppStore } from '@/store'
import type { RootStore } from '@/store/store.types'
import type { LoginRequest, TokenResponse } from '@/types/api/auth'

export function useAdminLoginMutation() {
  const setAdminAccessToken = useAppStore((s: RootStore) => s.setAdminAccessToken)

  return useMutation({
    mutationFn: async (payload: LoginRequest) =>
      apiFetch<TokenResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setAdminAccessToken(data.access_token)
    },
  })
}
