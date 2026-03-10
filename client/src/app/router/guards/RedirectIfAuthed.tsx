import { useEffect } from 'react'
import type { PropsWithChildren } from 'react'

import { useAuth } from '@/app/auth/useAuth'
import { navigate } from '@/app/router/navigation'
import { routes } from '@/app/router/routes'

export function RedirectIfAuthed({ children }: PropsWithChildren) {
  const { isAuthenticated } = useAuth()

  useEffect(() => {
    if (isAuthenticated) navigate(routes.booking, { replace: true })
  }, [isAuthenticated])

  if (isAuthenticated) return null
  return children
}
