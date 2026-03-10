import { useAppStore } from '@/store'

import { isAdminToken } from './jwt'

export function applyAccessToken(accessToken: string | null) {
  const store = useAppStore.getState()

  if (!accessToken) {
    store.clearAuth()
    store.resetBookingFlow()
    return
  }

  store.setAccount(null)

  if (isAdminToken(accessToken)) {
    store.setAdminAccessToken(accessToken)
    store.setAccessToken(null)
    return
  }

  store.setAccessToken(accessToken)
  store.setAdminAccessToken(null)
}

export function clearSession() {
  const store = useAppStore.getState()
  store.clearAuth()
  store.resetBookingFlow()
}
