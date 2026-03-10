import { useMutation } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import { useAppStore } from '@/store'
import type { CreateAircraftRequest } from '@/types/api/admin'
import type { AircraftResponse } from '@/types/api/aircraft'

export function useCreateAircraftMutation() {
  return useMutation({
    mutationFn: async (payload: CreateAircraftRequest) => {
      const adminToken = useAppStore.getState().auth.adminAccessToken
      if (!adminToken) throw new Error('Missing admin token')

      return apiFetch<AircraftResponse>('/api/v1/admin/aircraft', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      })
    },
  })
}
