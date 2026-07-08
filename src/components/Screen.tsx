import type { ReactNode } from 'react'
import { useT } from '../i18n.ts'

// Shared screen shell: a back-to-today link and a marker-underlined title.
// Keeps every roster/detail screen visually consistent without repeating markup.
export function Screen({ title, children }: { title: string; children: ReactNode }) {
  const t = useT()
  return (
    <section>
      <div style={{ marginBottom: 20 }}>
        <a href="#/" className="back-chip">
          {'← '}
          {t('screen.backToToday')}
        </a>
      </div>
      <h1 className="marker-underline">{title}</h1>
      {children}
    </section>
  )
}
