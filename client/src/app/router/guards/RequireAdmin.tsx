import { useEffect } from 'react'
import type { PropsWithChildren } from 'react'

import { useAuth } from '@/app/auth/useAuth'
import { navigate } from '@/app/router/navigation'
import { routes } from '@/app/router/routes'

export function RequireAdmin({ children }: PropsWithChildren) {
  const { isAuthenticated, isAdmin } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(routes.login, { replace: true })
      return
    }
    if (isAuthenticated && !isAdmin) navigate(routes.booking, { replace: true })
  }, [isAdmin, isAuthenticated])

  if (!isAuthenticated || !isAdmin) return null
  return children
}
