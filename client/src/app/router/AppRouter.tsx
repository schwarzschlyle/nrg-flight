import { useEffect } from 'react'

import { useAuthMeQuery } from '@/app/auth/useAuthMeQuery'
import { routes } from '@/app/router/routes'
import { usePathname } from '@/app/router/usePathname'
import { useAppStore } from '@/store'

import { RequireAdmin } from './guards/RequireAdmin'
import { RequireAuth } from './guards/RequireAuth'
import { navigate } from './navigation'

import AdminPage from '@/pages/AdminPage/page'
import BookingPage from '@/pages/BookingPage/page'
import LoginPage from '@/pages/LoginPage/page'
import RegisterPage from '@/pages/RegisterPage/page'
import TestPage from '@/pages/TestPage/page'

export function AppRouter() {
  const pathname = usePathname()
  const setAccount = useAppStore((s) => s.setAccount)
  const meQuery = useAuthMeQuery()

  useEffect(() => {
    if (meQuery.data) setAccount(meQuery.data)
  }, [meQuery.data, setAccount])

  useEffect(() => {
    if (pathname === routes.root) {
      const token = useAppStore.getState().auth.accessToken ?? useAppStore.getState().auth.adminAccessToken
      navigate(token ? routes.booking : routes.login, { replace: true })
    }
  }, [pathname])

  if (pathname === routes.login) {
    return (
      <LoginPage />
    )
  }

  if (pathname === routes.register) {
    return (
      <RegisterPage />
    )
  }

  if (pathname === routes.booking) {
    return (
      <RequireAuth>
        <BookingPage />
      </RequireAuth>
    )
  }

  if (pathname === routes.admin) {
    return (
      <RequireAdmin>
        <AdminPage />
      </RequireAdmin>
    )
  }

  if (pathname === routes.test) {
    return <TestPage />
  }

  navigate(routes.root, { replace: true })
  return null
}
