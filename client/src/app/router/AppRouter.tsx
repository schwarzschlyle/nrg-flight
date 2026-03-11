import { useEffect } from 'react'

import { useAuthMeQuery } from '@/app/auth/useAuthMeQuery'
import { routes } from '@/app/router/routes'
import { usePathname } from '@/app/router/usePathname'
import { useAppStore } from '@/store'

import { RequireAdmin } from './guards/RequireAdmin'
import { RequireAuth } from './guards/RequireAuth'
import { RedirectIfAuthed } from './guards/RedirectIfAuthed'
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
      // Treat the root path as the app's "entry" page.
      // For a first-time visitor, we want to land on /login.
      // Already-authenticated users will be redirected to /booking by <RedirectIfAuthed>.
      navigate(routes.login, { replace: true })
    }
  }, [pathname])

  if (pathname === routes.login) {
    return (
      <RedirectIfAuthed>
        <LoginPage />
      </RedirectIfAuthed>
    )
  }

  if (pathname === routes.register) {
    return (
      <RedirectIfAuthed>
        <RegisterPage />
      </RedirectIfAuthed>
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
