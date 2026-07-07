import { useRoute } from './nav'
import { Today } from './screens/Today'
import { WhosHere } from './screens/WhosHere'
import { Profiles } from './screens/Profiles'
import { Costs } from './screens/Costs'
import { Tournaments } from './screens/Tournaments'
import { Oscars } from './screens/Oscars'
import { Wifi } from './screens/Wifi'
import { Onboarding } from './screens/Onboarding'

type NavLink = { route: string; label: string }

const links: readonly NavLink[] = [
  { route: '', label: 'Today' },
  { route: 'whoshere', label: "Who's here" },
  { route: 'profiles', label: 'Profiles' },
  { route: 'costs', label: 'Costs' },
  { route: 'tournaments', label: 'Tournaments' },
  { route: 'oscars', label: 'Oscars' },
  { route: 'wifi', label: 'Wifi' },
  { route: 'onboarding', label: 'Onboarding' },
]

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
  return (
    <main style={{ maxWidth: 640, margin: '0 auto', padding: 16 }}>
      <nav aria-label="Screens" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {links.map((link) => (
          <a key={link.route} href={`#/${link.route}`}>
            {link.label}
          </a>
        ))}
      </nav>
      {screenFor(route)}
    </main>
  )
}

export default App
