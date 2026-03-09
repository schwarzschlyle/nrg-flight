export type AuthSlice = {
  auth: {
    accessToken: string | null
    adminAccessToken: string | null
  }
  setAccessToken: (token: string | null) => void
  setAdminAccessToken: (token: string | null) => void
}

export const createAuthSlice = (): AuthSlice => ({
  auth: {
    accessToken: null,
    adminAccessToken: null,
  },
  setAccessToken: (token) => {
    // This slice is merged into the store; implementation is patched by Zustand in store/index.ts.
    void token
  },
  setAdminAccessToken: (token) => {
    void token
  },
})
