import { Card } from '../components/Card.tsx'
import { LangSwitcher } from '../components/LangSwitcher.tsx'
import { Screen } from '../components/Screen.tsx'
import { useT } from '../i18n.ts'
import { appUrl, waShareUrl } from '../share.ts'
import { todayISO } from '../today.ts'
import { tripPhase } from '../domain/presence.ts'
import { people$, useRows } from '../store.ts'

// ponytail: platform sniff + one captured event, not a PWA install library
let installPrompt: { prompt: () => void } | null = null
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  installPrompt = e as unknown as { prompt: () => void }
})

// Install hint: nothing when already installed, iOS gets the Share-menu tip,
// Android gets a real install button (or the menu tip if Chrome never offered).
function InstallHint() {
  const t = useT()
  if (matchMedia('(display-mode: standalone)').matches) return null
  const ios = /iPhone|iPad|iPod/.test(navigator.userAgent)
  return (
    <Card style={{ marginTop: 24, textAlign: 'center' }}>
      <h3 style={{ margin: '0 0 12px' }}>{t('info.installTitle')}</h3>
      {ios ? (
        <p>{t('info.installIos')}</p>
      ) : installPrompt ? (
        <button type="button" className="back-chip" onClick={() => installPrompt?.prompt()}>
          {t('info.installButton')}
        </button>
      ) : (
        <p>{t('info.installFallback')}</p>
      )}
    </Card>
  )
}

// The calm junk drawer: share the app and language. Its big red button is
// the share link, which flips to the recap once the trip is over.
export function Info() {
  const t = useT()
  const people = useRows(people$)
  const after = tripPhase(people, todayISO()) === 'after'
  const line = after ? t('today.recapLine') : t('today.inviteLine')
  const label = after ? t('today.shareRecap') : t('today.shareLink')

  return (
    <Screen title={t('tabs.info')}>
      <a
        href={waShareUrl(`${line} ${appUrl()}`)}
        target="_blank"
        rel="noreferrer"
        className="big-red"
        style={{ marginBottom: 24 }}
      >
        {label}
      </a>

      <InstallHint />

      <Card style={{ marginTop: 24, textAlign: 'center' }}>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <LangSwitcher />
        </div>
      </Card>
    </Screen>
  )
}
