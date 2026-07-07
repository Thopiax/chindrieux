import { use$ } from '@legendapp/state/react'
import { useRoute } from './nav'
import { myId$ } from './identity'
import { Today } from './screens/Today'
import { WhosHere } from './screens/WhosHere'
import { Profiles } from './screens/Profiles'
import { Costs } from './screens/Costs'
import { Tournaments } from './screens/Tournaments'
import { Oscars } from './screens/Oscars'
import { Wifi } from './screens/Wifi'
import { Onboarding } from './screens/Onboarding'

function screenFor(route: string) {
  switch (route) {
    case 'whoshere':
      return <WhosHere />
    case 'profiles':
      return <Profiles />
    case 'costs':
      return <Costs />
    case 'tournaments':
      return <Tournaments />
    case 'oscars':
      return <Oscars />
    case 'wifi':
      return <Wifi />
    case 'onboarding':
      return <Onboarding />
    default:
      return <Today />
  }
}

function App() {
  const route = useRoute()
  const myId = use$(myId$)
  if (!myId) {
    return (
      <main style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
        <Onboarding />
      </main>
    )
  }
  // Today is the front door: it carries the sticker-card navigation, and every
  // other screen carries a back-to-today link, so no global nav bar is needed.
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
      {screenFor(route)}
    </main>
  )
}

export default App
