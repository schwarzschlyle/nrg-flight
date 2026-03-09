import { useMutation } from '@tanstack/react-query'

import { apiFetch } from '@/app/api/http'
import type { BookingResponse, CreateBookingRequest } from '@/types/api/booking'

export function useBookSeatMutation() {
  return useMutation({
    mutationFn: async (payload: CreateBookingRequest) =>
      apiFetch<BookingResponse>('/api/v1/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
  })
}
