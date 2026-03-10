import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import { useAppStore } from '@/store'
import type { ManifestEntryResponse } from '@/types/api/admin'

export function useManifestQuery(flightId: string | null) {
  const adminToken = useAppStore((s) => s.auth.adminAccessToken)

  return useQuery({
    queryKey: ['manifest', flightId],
    enabled: !!flightId && !!adminToken,
    queryFn: async () => {
      if (!adminToken) throw new Error('Missing admin token')

      return apiFetch<ManifestEntryResponse[]>(`/api/v1/admin/flights/${flightId}/manifest`, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      })
    },
  })
}
