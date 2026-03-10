import { useMutation } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import { applyAccessToken } from '@/app/auth/auth.actions'
import type { LoginRequest, TokenResponse } from '@/types/api/auth'

export function useLoginMutation() {
  return useMutation({
    mutationFn: async (payload: LoginRequest) =>
      apiFetch<TokenResponse>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: (data) => {
      applyAccessToken(data.access_token)
    },
  })
}
