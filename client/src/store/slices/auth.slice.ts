import type { AccountResponse } from '@/types/api/auth'

export type AuthSlice = {
  auth: {
    accessToken: string | null
    adminAccessToken: string | null
    account: AccountResponse | null
  }
  setAccessToken: (token: string | null) => void
  setAdminAccessToken: (token: string | null) => void
  setAccount: (account: AccountResponse | null) => void
  clearAuth: () => void
}

export const createAuthSlice = (): AuthSlice => ({
  auth: {
    accessToken: null,
    adminAccessToken: null,
    account: null,
  },
  setAccessToken: (token) => {
    void token
  },
  setAdminAccessToken: (token) => {
    void token
  },
  setAccount: (account) => {
    void account
  },
  clearAuth: () => {
  },
})
