import { useMutation } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import { useAppStore } from '@/store'
import type { FlightResponse } from '@/types/api/flight'
import type { CreateFlightRequest } from '@/types/api/admin'

export function useCreateFlightMutation() {
  return useMutation({
    mutationFn: async (payload: CreateFlightRequest) => {
      const adminToken = useAppStore.getState().auth.adminAccessToken
      if (!adminToken) throw new Error('Missing admin token')

      return apiFetch<FlightResponse>('/api/v1/admin/flights', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify(payload),
      })
    },
  })
}
