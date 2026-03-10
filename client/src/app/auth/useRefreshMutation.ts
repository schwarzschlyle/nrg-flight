import { useMutation } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import { applyAccessToken } from '@/app/auth/auth.actions'
import type { TokenResponse } from '@/types/api/auth'

export function useRefreshMutation() {
  return useMutation({
    mutationFn: () =>
      apiFetch<TokenResponse>('/api/v1/auth/refresh', {
        method: 'POST',
      }),
    onSuccess: (data) => {
      applyAccessToken(data.access_token)
    },
  })
}
