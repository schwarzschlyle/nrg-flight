import { useMutation } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import { useAppStore } from '@/store'
import type { RootStore } from '@/store/store.types'
import type { LoginRequest, TokenResponse } from '@/types/api/auth'

export function useLoginMutation() {
  const setAccessToken = useAppStore((s: RootStore) => s.setAccessToken)

  return useMutation({
    mutationFn: async (payload: LoginRequest) =>
      apiFetch<TokenResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      setAccessToken(data.access_token)
    },
  })
}
