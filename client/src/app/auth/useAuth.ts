import { useMemo } from 'react'

import { useAppStore } from '@/store'
import type { RootStore } from '@/store/store.types'

import { selectAccount, selectAuthToken, selectIsAdmin, selectIsAuthenticated } from './auth.selectors'

export function useAuth() {
  const isAuthenticated = useAppStore(selectIsAuthenticated)
  const isAdmin = useAppStore(selectIsAdmin)
  const token = useAppStore(selectAuthToken)
  const account = useAppStore((s: RootStore) => selectAccount(s))

  return useMemo(
    () => ({
      isAuthenticated,
      isAdmin,
      token,
      account,
    }),
    [account, isAdmin, isAuthenticated, token],
  )
}
