import { useEffect, useState } from 'react'
export function useRoute(): string {
  const [route, setRoute] = useState(() => location.hash.slice(2))
  useEffect(() => {
    const onHash = () => setRoute(location.hash.slice(2))
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])
  return route
}
export const go = (r: string) => { location.hash = `#/${r}` }
