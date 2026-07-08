import type { ReactNode } from 'react'

// Shared screen shell: a marker-underlined title. Navigation lives in the
// bottom TabBar, so tab roots carry no back link.
export function Screen({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h1 className="marker-underline">{title}</h1>
      {children}
    </section>
  )
}
