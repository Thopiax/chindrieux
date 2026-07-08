import { useEffect, useState } from 'react'

// Route is the hash path without its query: '#/costs?new' -> 'costs'.
const parseRoute = () => location.hash.slice(2).split('?')[0]

export function useRoute(): string {
  const [route, setRoute] = useState(parseRoute)
  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])
  return route
}

// Query params carried by the hash route: '#/costs?new' -> has('new').
export const routeQuery = (): URLSearchParams =>
  new URLSearchParams(location.hash.split('?')[1] ?? '')

export const go = (r: string) => { location.hash = `#/${r}` }
