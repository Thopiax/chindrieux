import { use$ } from '@legendapp/state/react'
import { useRoute } from './nav'
import { myId$ } from './identity'
import { useT } from './i18n'
import { TabBar } from './components/TabBar'
import { Profiles } from './screens/Profiles'
import { Costs } from './screens/Costs'
import { Tournaments } from './screens/Tournaments'
import { Oscars } from './screens/Oscars'
import { Info } from './screens/Info'
import { Onboarding } from './screens/Onboarding'

function screenFor(route: string) {
  switch (route) {
    case 'costs':
      return <Costs />
    case 'tournaments':
      return <Tournaments />
    case 'oscars':
      return <Oscars />
    case 'wifi':
    case 'info':
      return <Info />
    case 'onboarding':
      return <Onboarding />
    default:
      // '', 'profiles', 'whoshere': Crew is the landing tab and absorbs both.
      return <Profiles />
  }
}

function App() {
  const t = useT()
  const route = useRoute()
  const myId = use$(myId$)
  if (!myId) {
    return (
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '32px 20px 64px' }}>
        <Onboarding />
      </main>
    )
  }
  // Tabbed shell: a thin wordmark, the active tab's screen, and the fixed
  // bottom TabBar. Bottom padding keeps content clear of the bar.
  return (
    <>
      <main
        style={{
          maxWidth: 640, margin: '0 auto',
          padding: '24px 20px calc(96px + env(safe-area-inset-bottom))',
        }}
      >
        <p
          className="marker-underline"
          style={{
            fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15,
            margin: '0 0 24px',
          }}
        >
          {t('today.appTitle')}
        </p>
        {screenFor(route)}
      </main>
      <TabBar />
    </>
  )
}

export default App
