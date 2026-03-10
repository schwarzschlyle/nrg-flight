export type JwtPayload = {
  sub?: string
  type?: string
  adm?: boolean
  exp?: number
  iat?: number
  jti?: string
  [k: string]: unknown
}

function base64UrlToBase64(input: string) {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4
  if (!pad) return base64
  return base64 + '='.repeat(4 - pad)
}

export function decodeJwtPayload(token: string): JwtPayload | null {
  const parts = token.split('.')
  if (parts.length < 2) return null
  try {
    const json = atob(base64UrlToBase64(parts[1]))
    return JSON.parse(json) as JwtPayload
  } catch {
    return null
  }
}

export function isAdminToken(token: string) {
  return decodeJwtPayload(token)?.adm === true
}
