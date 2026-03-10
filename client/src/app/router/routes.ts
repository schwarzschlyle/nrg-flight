export const routes = {
  root: '/',
  login: '/login',
  register: '/register',
  booking: '/booking',
  admin: '/admin',
  test: '/test',
} as const

export type AppRoutePath = (typeof routes)[keyof typeof routes]
