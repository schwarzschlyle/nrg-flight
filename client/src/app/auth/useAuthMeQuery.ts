import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import { useAppStore } from '@/store'
import type { AccountResponse } from '@/types/api/auth'

export function useAuthMeQuery() {
  const token = useAppStore((s) => s.auth.accessToken ?? s.auth.adminAccessToken)

  return useQuery({
    queryKey: ['auth', 'me'],
    enabled: !!token,
    queryFn: () => apiFetch<AccountResponse>('/api/v1/auth/me'),
  })
}
