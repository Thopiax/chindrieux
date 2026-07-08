import type { ReactNode } from 'react'
import { useT } from '../i18n.ts'

// Shared screen shell: wordmark on the left, marker-underlined screen title on
// the right of the same row. Navigation lives in the bottom TabBar, so tab
// roots carry no back link.
export function Screen({ title, children }: { title: string; children: ReactNode }) {
  const t = useT()
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
        <p
          className="marker-underline"
          style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, margin: 0 }}
        >
          {t('today.appTitle')}
        </p>
        <h1 className="marker-underline" style={{ margin: 0 }}>{title}</h1>
      </div>
      {children}
    </section>
  )
}
