import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import { useAppStore } from '@/store'
import type { AircraftResponse } from '@/types/api/aircraft'

export function useAircraftQuery() {
  const token = useAppStore((s) => s.auth.accessToken ?? s.auth.adminAccessToken)

  return useQuery({
    queryKey: ['aircraft'],
    enabled: !!token,
    queryFn: () => apiFetch<AircraftResponse[]>('/api/v1/aircraft'),
  })
}
