import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import { useAppStore } from '@/store'
import type { ManifestEntryResponse } from '@/types/api/admin'

export function useManifestQuery(flightId: string | null) {
  return useQuery({
    queryKey: ['manifest', flightId],
    enabled: !!flightId && !!useAppStore.getState().auth.adminAccessToken,
    queryFn: async () => {
      const token = useAppStore.getState().auth.adminAccessToken
      if (!token) throw new Error('Missing admin token')

      return apiFetch<ManifestEntryResponse[]>(`/api/v1/admin/flights/${flightId}/manifest`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
    },
  })
}
