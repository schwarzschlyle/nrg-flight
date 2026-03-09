import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import type { SeatResponse } from '@/types/api/seat'

export function useFirstAvailableSeatQuery(flightId: string | null) {
  return useQuery({
    queryKey: ['first-available-seat', flightId],
    enabled: false,
    queryFn: () => apiFetch<SeatResponse>(`/api/v1/flights/${flightId}/seats/first-available`),
  })
}
