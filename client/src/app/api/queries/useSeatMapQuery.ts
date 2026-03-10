import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import type { SeatMapResponse } from '@/types/api/seat'

export function useSeatMapQuery(flightId: string | null) {
  return useQuery({
    queryKey: ['seat-map', flightId],
    enabled: !!flightId,
    queryFn: () => apiFetch<SeatMapResponse>(`/api/v1/flights/${flightId}/seats`),
  })
}
