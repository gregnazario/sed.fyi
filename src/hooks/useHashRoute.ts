import { useEffect, useState } from 'react'

export type Route = 'home' | 'cheatsheet'

const parseHash = (): Route =>
  typeof window !== 'undefined' && window.location.hash.startsWith('#/cheatsheet')
    ? 'cheatsheet'
    : 'home'

/**
 * Minimal hash router: `#/cheatsheet` opens the cheatsheet, anything else is
 * the project registry. History/back-button work via hashchange/popstate.
 */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash)

  useEffect(() => {
    const sync = () => setRoute(parseHash())
    window.addEventListener('hashchange', sync)
    window.addEventListener('popstate', sync)
    return () => {
      window.removeEventListener('hashchange', sync)
      window.removeEventListener('popstate', sync)
    }
  }, [])

  return route
}

export function navigate(route: Route) {
  if (route === 'cheatsheet') {
    window.location.hash = '/cheatsheet'
    return
  }
  // Leaving the cheatsheet: strip the fragment entirely for a clean URL
  // (`location.hash = ''` would leave a trailing `#`). pushState doesn't
  // fire hashchange, so ping the router directly; popstate keeps the
  // listener synced with real back/forward navigation too.
  if (window.location.hash && window.location.hash !== '#') {
    history.pushState(null, '', window.location.pathname + window.location.search)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }
}
