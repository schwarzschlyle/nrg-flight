import type { RootStore } from '@/store/store.types'

import { decodeJwtPayload } from './jwt'

export function selectIsAuthenticated(s: RootStore) {
  return !!s.auth.accessToken || !!s.auth.adminAccessToken
}

export function selectIsAdmin(s: RootStore) {
  const token = s.auth.adminAccessToken ?? s.auth.accessToken
  if (!token) return false
  return decodeJwtPayload(token)?.adm === true
}

export function selectAuthToken(s: RootStore) {
  return s.auth.accessToken ?? s.auth.adminAccessToken
}

export function selectAccount(s: RootStore) {
  return s.auth.account
}
