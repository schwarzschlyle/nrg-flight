export type RegisterRequest = {
  email: string
  password: string
  full_name: string
}

export type LoginRequest = {
  email: string
  password: string
}

export type AccountResponse = {
  id: string
  email: string
  full_name: string
  has_verified_email: boolean
}

export type TokenResponse = {
  access_token: string
  token_type: 'bearer'
  expires_in: number
}
