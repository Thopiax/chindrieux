import { useT } from '../i18n.ts'
import { useRoute } from '../nav.ts'

// The five experiences. Old deep-link routes stay as aliases so shared links
// keep working: whoshere lives inside Crew.
const TABS = [
  { href: '#/', emoji: '🪪', key: 'tabs.crew', routes: ['', 'profiles', 'whoshere'] },
  { href: '#/costs', emoji: '💸', key: 'tabs.costs', routes: ['costs'] },
  { href: '#/tournaments', emoji: '🏆', key: 'tabs.games', routes: ['tournaments'] },
  { href: '#/oscars', emoji: '🎬', key: 'tabs.oscars', routes: ['oscars'] },
  { href: '#/info', emoji: 'ℹ️', key: 'tabs.info', routes: ['info'] },
] as const

export function TabBar() {
  const t = useT()
  const route = useRoute()
  return (
    <nav
      aria-label={t('today.navAria')}
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: 'var(--color-paper)', borderTop: '2px solid var(--color-ink)',
        padding: '6px 6px calc(6px + env(safe-area-inset-bottom))',
      }}
    >
      <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', gap: 4 }}>
        {TABS.map((tab) => {
          const active = (tab.routes as readonly string[]).includes(route)
          return (
            <a
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 2, padding: '6px 2px', minHeight: 52, justifyContent: 'center',
                textDecoration: 'none', color: 'var(--color-ink)', fontWeight: 700,
                fontSize: 11, borderRadius: 12,
                background: active ? 'var(--color-sunny)' : 'transparent',
                opacity: active ? 1 : 0.7,
              }}
            >
              <span aria-hidden style={{ fontSize: 22, lineHeight: 1 }}>{tab.emoji}</span>
              {t(tab.key)}
            </a>
          )
        })}
      </div>
    </nav>
  )
}
