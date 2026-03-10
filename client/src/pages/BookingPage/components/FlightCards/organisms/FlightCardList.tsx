import { Alert, Box, Stack, Typography } from '@mui/material'
import { useMemo } from 'react'

import { useSlotsQuery } from '@/app/api/queries/useSlotsQuery'
import { useAppStore } from '@/store'
import type { RootStore } from '@/store/store.types'

import { FlightCard } from '../molecules/FlightCard'
import { FlightCardSkeleton } from '../molecules/FlightCardSkeleton'

export function FlightCardList() {
  const departureDate = useAppStore((s: RootStore) => s.bookingFlow.departureDate)
  const slotId = useAppStore((s: RootStore) => s.bookingFlow.slotId)
  const setSlotId = useAppStore((s: RootStore) => s.setSlotId)
  const setFlightId = useAppStore((s: RootStore) => s.setFlightId)
  const setAircraftId = useAppStore((s: RootStore) => s.setAircraftId)

  const slotsQuery = useSlotsQuery(departureDate)

  const flights = useMemo(
    () => (slotsQuery.data ?? []).filter((s) => !!s.flight_id).sort((a, b) => a.slot_id - b.slot_id),
    [slotsQuery.data],
  )

  const onSelect = (newSlotId: number) => {
    const slot = flights.find((s) => s.slot_id === newSlotId)
    setAircraftId(slot?.aircraft_id ?? null)
    setSlotId(newSlotId)
    setFlightId(slot?.flight_id ?? null)
  }

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" alignItems="center" spacing={1.25}>
        <Typography variant="h6" fontWeight={900}>
          Available flights
        </Typography>
      </Stack>

      {slotsQuery.isError && <Alert severity="error">Failed to load flights. Please sign in again.</Alert>}

      {slotsQuery.isLoading && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          {Array.from({ length: 4 }, (_, i) => (
            <FlightCardSkeleton key={i} />
          ))}
        </Box>
      )}

      {slotsQuery.isSuccess && flights.length === 0 && <Alert severity="info">No flights available for this date.</Alert>}

      {slotsQuery.isSuccess && flights.length > 0 && (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
            gap: 2,
          }}
        >
          {flights.map((f) => (
            <FlightCard key={f.slot_id} slot={f} selected={slotId === f.slot_id} onSelect={() => onSelect(f.slot_id)} />
          ))}
        </Box>
      )}
    </Stack>
  )
}
