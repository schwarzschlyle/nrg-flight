import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import type { SlotFlightResponse } from '@/types/api/flight'

export function useSlotFlightQuery(slotId: number | null, date: string) {
  return useQuery({
    queryKey: ['slot-flight', slotId, date],
    enabled: slotId !== null,
    queryFn: () => apiFetch<SlotFlightResponse>(`/api/v1/slots/${slotId}/flight?date=${encodeURIComponent(date)}`),
  })
}
