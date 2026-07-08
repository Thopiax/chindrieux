import { Card } from '../components/Card.tsx'
import { LangSwitcher } from '../components/LangSwitcher.tsx'
import { Screen } from '../components/Screen.tsx'
import { useT } from '../i18n.ts'
import { appUrl, waShareUrl } from '../share.ts'
import { todayISO } from '../today.ts'
import { tripPhase } from '../domain/presence.ts'
import { people$, useRows } from '../store.ts'

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

      <Card style={{ marginTop: 24, textAlign: 'center' }}>
        <div style={{ display: 'grid', placeItems: 'center' }}>
          <LangSwitcher />
        </div>
      </Card>
    </Screen>
  )
}
