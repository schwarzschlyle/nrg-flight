import { env } from '@/app/config/env'
import { useAppStore } from '@/store'

export type ApiErrorPayload = {
  message: string
}

export class ApiError extends Error {
  public readonly status: number
  public readonly payload?: ApiErrorPayload

  constructor(message: string, opts: { status: number; payload?: ApiErrorPayload }) {
    super(message)
    this.name = 'ApiError'
    this.status = opts.status
    this.payload = opts.payload
  }
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const run = async () => {
    const { accessToken, adminAccessToken } = useAppStore.getState().auth
    const token = path.startsWith('/api/v1/admin') ? adminAccessToken : (accessToken ?? adminAccessToken)
    const url = `${env.apiBaseUrl}${path}`

    const headers = new Headers(init?.headers)
    headers.set('Accept', 'application/json')
    if (!headers.has('Content-Type') && init?.body) headers.set('Content-Type', 'application/json')
    if (!headers.has('Authorization') && token) headers.set('Authorization', `Bearer ${token}`)

    const res = await fetch(url, {
      ...init,
      headers,
      credentials: 'include',
    })

    const isJson = (res.headers.get('content-type') ?? '').includes('application/json')
    const payload = isJson
      ? await res
          .clone()
          .json()
          .then((v) => v as ApiErrorPayload)
          .catch(() => undefined)
      : undefined

    if (!res.ok) {
      const msg = payload?.message ?? res.statusText
      throw new ApiError(msg, { status: res.status, payload })
    }

    if (res.status === 204) return undefined as T
    return (isJson ? await res.json() : await res.text()) as T
  }

  try {
    return await run()
  } catch (e) {
    if (!(e instanceof ApiError) || e.status !== 401) throw e

    // Prevent infinite loops.
    if (path === '/api/v1/auth/refresh') throw e

    // If we have no token in memory, there's nothing to refresh.
    const token = useAppStore.getState().auth.accessToken ?? useAppStore.getState().auth.adminAccessToken
    if (!token) throw e

    // Attempt silent refresh and retry once.
    try {
      const refreshed = await apiFetch<{ access_token: string }>('/api/v1/auth/refresh', { method: 'POST' })
      const { applyAccessToken } = await import('@/app/auth/auth.actions')
      applyAccessToken(refreshed.access_token)
      return await run()
    } catch {
      // Refresh failed (expired cookie, revoked, etc.)
      const { clearSession } = await import('@/app/auth/auth.actions')
      clearSession()
      throw e
    }
  }
}
