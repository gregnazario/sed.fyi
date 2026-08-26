import { useEffect, useState } from 'react'

export type Route = 'home' | 'cheatsheet'

const parseHash = (): Route =>
  typeof window !== 'undefined' && window.location.hash.startsWith('#/cheatsheet')
    ? 'cheatsheet'
    : 'home'

/**
 * Minimal hash router: `#/cheatsheet` opens the cheatsheet, anything else is
 * the project registry. History/back-button work for free via hashchange.
 */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(parseHash)

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  return route
}

export function navigate(route: Route) {
  if (route === 'cheatsheet') {
    window.location.hash = '/cheatsheet'
  } else {
    // Assigning empty string drops the '#' cleanly and still fires hashchange.
    window.location.hash = ''
  }
}
