const STORAGE_KEY = 'nrg-flight.auth'

type StoredAuth = {
  kind: 'user' | 'admin'
  token: string
}

function safeParse(json: string | null): StoredAuth | null {
  if (!json) return null
  try {
    return JSON.parse(json) as StoredAuth
  } catch {
    return null
  }
}

export const authStorage = {
  read(): StoredAuth | null {
    return safeParse(window.localStorage.getItem(STORAGE_KEY))
  },
  write(auth: StoredAuth) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(auth))
  },
  clear() {
    window.localStorage.removeItem(STORAGE_KEY)
  },
}
