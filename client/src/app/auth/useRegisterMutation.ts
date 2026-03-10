import { useMutation } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import type { AccountResponse, RegisterRequest } from '@/types/api/auth'

export function useRegisterMutation() {
  return useMutation({
    mutationFn: async (payload: RegisterRequest) =>
      apiFetch<AccountResponse>('/api/v1/auth/register', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  })
}
