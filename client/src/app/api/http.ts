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
  const { accessToken, adminAccessToken } = useAppStore.getState().auth
  const token = accessToken ?? adminAccessToken
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
  if (!res.ok) {
    const payload = isJson ? ((await res.json()) as ApiErrorPayload) : undefined
    const msg = payload?.message ?? res.statusText
    throw new ApiError(msg, { status: res.status, payload })
  }

  if (res.status === 204) return undefined as T
  return (isJson ? await res.json() : await res.text()) as T
}
