import { routes } from '@/app/router/routes'

type NavigateOptions = {
  replace?: boolean
}

export function navigate(path: string, opts?: NavigateOptions) {
  const nextPath = path.startsWith('/') ? path : `/${path}`
  const current = window.location.pathname + window.location.search
  if (current === nextPath) return

  if (opts?.replace) window.history.replaceState(null, '', nextPath)
  else window.history.pushState(null, '', nextPath)

  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function redirectToDefault() {
  navigate(routes.root, { replace: true })
}
