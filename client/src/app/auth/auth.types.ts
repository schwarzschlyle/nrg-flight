import type { AccountResponse } from '@/types/api/auth'

export type AuthKind = 'user' | 'admin'

export type AuthState = {
  kind: AuthKind | null
  accessToken: string | null
  account: AccountResponse | null
}
