import { useMutation, useQueryClient } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import { clearSession } from '@/app/auth/auth.actions'
import type { MessageResponse } from '@/types/api/common'

export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      apiFetch<MessageResponse>('/api/v1/auth/logout', {
        method: 'POST',
      }),
    onSuccess: async () => {
      clearSession()
      await queryClient.clear()
    },
  })
}
