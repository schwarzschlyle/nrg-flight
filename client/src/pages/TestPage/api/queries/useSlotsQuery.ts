import { useQuery } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import type { SlotResponse } from '@/types/api/flight'

export function useSlotsQuery(date: string) {
  return useQuery({
    queryKey: ['slots', date],
    queryFn: () => apiFetch<SlotResponse[]>(`/api/v1/slots?date=${encodeURIComponent(date)}`),
  })
}
