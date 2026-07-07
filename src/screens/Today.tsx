import type { CSSProperties } from 'react'
import { use$ } from '@legendapp/state/react'
import { Badge } from '../components/Badge.tsx'
import { Card } from '../components/Card.tsx'
import { LangSwitcher } from '../components/LangSwitcher.tsx'
import { useT } from '../i18n.ts'
import { myId$ } from '../identity.ts'
import { go } from '../nav.ts'
import { appUrl, waShareUrl } from '../share.ts'
import { todayISO } from '../today.ts'
import { config$, expenses$, matches$, payments$, people$, tournaments$, useRows } from '../store.ts'
import { daysUntil, presentOn, tripPhase, tripRange } from '../domain/presence.ts'
import { standings } from '../domain/standings.ts'
import { balances, suggestTransfers } from '../domain/money.ts'
import type { Game, Person } from '../domain/types.ts'

type T = ReturnType<typeof useT>

// Same mapping as Tournaments'; kept local so both files stay fast-refreshable.
// Record<Game, string> keeps each copy exhaustive when a game is added.
const gameEmoji: Record<Game, string> = { pingpong: '🏓', chess: '♟️', foosball: '⚽' }

const fmtCents = (cents: number): string => `€${(cents / 100).toFixed(2)}`

const primaryLink: CSSProperties = {
  display: 'inline-block', fontFamily: 'inherit', fontWeight: 700, fontSize: 15,
  color: '#fff', background: 'var(--color-cerulean)', borderRadius: 9999,
  padding: '9px 18px', textDecoration: 'none',
}
const bigLine: CSSProperties = {
  fontFamily: 'var(--font-display)', fontSize: 26, fontWeight: 700, margin: 0,
}
const cardHeading: CSSProperties = { fontWeight: 700, margin: '0 0 10px', fontSize: 15 }
const badgeRow: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: 8 }
const stack: CSSProperties = { display: 'flex', flexDirection: 'column', gap: 20 }

// The six screens, as a sticker grid: the home's navigation.
const stickers = [
  { route: 'whoshere', emoji: '🗓️', key: 'whoshere.title' },
  { route: 'profiles', emoji: '🪪', key: 'profiles.title' },
  { route: 'costs', emoji: '💸', key: 'costs.title' },
  { route: 'tournaments', emoji: '🏆', key: 'tournaments.title' },
  { route: 'oscars', emoji: '🎬', key: 'oscars.title' },
  { route: 'wifi', emoji: '📶', key: 'wifi.title' },
] as const

export function Today() {
  const t = useT()
  const myId = use$(myId$)
  const people = useRows(people$)
  const today = todayISO()
  const phase = tripPhase(people, today)
  const me = people.find((p) => p.id === myId)

  return (
    <section>
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <h1 className="marker-underline" style={{ flex: 1, margin: 0 }}>{t('today.appTitle')}</h1>
        <LangSwitcher />
        {me && (
          <button
            type="button"
            aria-label={t('today.myProfile')}
            onClick={() => go('profiles')}
            style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
          >
            <Badge person={me} size="sm" />
          </button>
        )}
      </header>

      {phase === 'before' && <Before t={t} people={people} today={today} />}
      {phase === 'during' && <During t={t} people={people} today={today} />}
      {phase === 'after' && <After t={t} myId={myId} />}

      <nav
        aria-label={t('today.navAria')}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 18, marginTop: 32 }}
      >
        {stickers.map((s) => (
          <a
            key={s.route}
            href={`#/${s.route}`}
            className="card-taped"
            style={{
              textAlign: 'center', textDecoration: 'none', color: 'var(--color-ink)',
              fontWeight: 700, fontSize: 15, padding: '18px 8px',
            }}
          >
            <span aria-hidden style={{ display: 'block', fontSize: 36, marginBottom: 6 }}>{s.emoji}</span>
            {t(s.key)}
          </a>
        ))}
      </nav>
    </section>
  )
}

// --- before: countdown, roster so far, share the link ---

function Before({ t, people, today }: { t: T; people: Person[]; today: string }) {
  const range = tripRange(people)
  const missing = people.filter((p) => !p.avatar_emoji || !p.arrival || !p.departure)
  return (
    <div style={stack}>
      {range && (() => {
        const n = daysUntil(today, range.start)
        return (
          <Card>
            <p style={bigLine}>{t(n === 1 ? 'today.daysToGo.one' : 'today.daysToGo', { n })}</p>
          </Card>
        )
      })()}
      {people.length > 0 && (
        <Card>
          <p style={cardHeading}>{t('today.rosterSoFar')}</p>
          <div style={badgeRow}>
            {people.map((p) => <Badge key={p.id} person={p} size="sm" />)}
          </div>
          {missing.length > 0 && (
            <p style={{ fontSize: 13, margin: '10px 0 0', opacity: 0.75 }}>
              {t('today.stillMissing', { names: missing.map((p) => p.name).join(', ') })}
            </p>
          )}
        </Card>
      )}
      <ShareCard label={t('today.shareLink')} line={t('today.inviteLine')} />
    </div>
  )
}

// --- during: arrivals, departures, here now, one-taps ---

function During({ t, people, today }: { t: T; people: Person[]; today: string }) {
  const arriving = people.filter((p) => p.arrival === today)
  const leaving = people.filter((p) => p.departure === today)
  const here = presentOn(people, today)
  const oscarsPhase = use$(() => config$['main'].oscars_phase.get() ?? 'proposing')
  const oscarsNudge =
    oscarsPhase === 'proposing' ? t('today.proposeNudge')
    : oscarsPhase === 'voting' ? t('today.voteNudge')
    : t('today.ceremonyLink')

  return (
    <div style={stack}>
      {arriving.length > 0 && <PeopleCard heading={t('today.arrivingToday')} people={arriving} />}
      {leaving.length > 0 && <PeopleCard heading={t('today.leavingToday')} people={leaving} />}
      {here.length > 0 && <PeopleCard heading={t('today.hereNow')} people={here} />}
      <Card>
        <a href="#/costs?new" style={primaryLink}>{t('costs.addExpense')}</a>
      </Card>
      <Leader t={t} people={people} />
      <Card>
        <a href="#/oscars" style={{ fontWeight: 700, color: 'var(--color-ink)' }}>🎬 {oscarsNudge}</a>
      </Card>
      <Card>
        <a href="#/wifi" style={{ fontWeight: 700, color: 'var(--color-ink)' }}>📶 {t('wifi.title')}</a>
      </Card>
    </div>
  )
}

// Current tournament = the one with the most recently played match; its leader
// is the top of that tournament's standings. Nothing played yet: no card.
function Leader({ t, people }: { t: T; people: Person[] }) {
  const tournaments = useRows(tournaments$)
  const matches = useRows(matches$)
  const latest = matches.reduce<typeof matches[number] | null>(
    (a, m) => (a === null || m.played_at > a.played_at ? m : a), null,
  )
  const tournament = latest ? tournaments.find((tr) => tr.id === latest.tournament_id) : undefined
  if (!tournament) return null
  const top = standings(matches.filter((m) => m.tournament_id === tournament.id))[0]
  const leader = top ? people.find((p) => p.id === top.personId) : undefined
  if (!leader) return null
  return (
    <Card>
      <a href="#/tournaments" style={{ fontWeight: 700, color: 'var(--color-ink)' }}>
        {gameEmoji[tournament.game]} {t('today.leads', { name: leader.name })}
      </a>
    </Card>
  )
}

// --- after: wrap, settle-up summary, ceremony, recap ---

function After({ t, myId }: { t: T; myId: string | null }) {
  const expenses = useRows(expenses$)
  const payments = useRows(payments$)
  const oscarsPhase = use$(() => config$['main'].oscars_phase.get() ?? 'proposing')
  const b = balances(expenses, payments)
  const transfers = suggestTransfers(b)
  const myBalance = (myId && b.get(myId)) || 0

  return (
    <div style={stack}>
      <Card>
        <p style={bigLine}>{t('today.wrap')}</p>
      </Card>
      <Card>
        <a href="#/costs" style={{ fontWeight: 700, color: 'var(--color-ink)' }}>
          💸 {transfers.length === 0
            ? t('costs.allSquare')
            : t(transfers.length === 1 ? 'today.transfersLeft.one' : 'today.transfersLeft', { n: transfers.length })}
        </a>
        {myBalance !== 0 && (
          <p style={{ margin: '8px 0 0', fontSize: 14 }}>
            {myBalance < 0
              ? t('today.youOwe', { amount: fmtCents(-myBalance) })
              : t('today.youAreOwed', { amount: fmtCents(myBalance) })}
          </p>
        )}
      </Card>
      {oscarsPhase === 'revealed' && (
        <Card>
          <a href="#/oscars" style={{ fontWeight: 700, color: 'var(--color-ink)' }}>
            🎬 {t('today.ceremonyLink')}
          </a>
        </Card>
      )}
      <ShareCard label={t('today.shareRecap')} line={t('today.recapLine')} />
    </div>
  )
}

// --- shared bits ---

function PeopleCard({ heading, people }: { heading: string; people: Person[] }) {
  return (
    <Card>
      <p style={cardHeading}>{heading}</p>
      <div style={badgeRow}>
        {people.map((p) => <Badge key={p.id} person={p} size="sm" />)}
      </div>
    </Card>
  )
}

// WhatsApp share button: prefilled line + the app's own URL.
function ShareCard({ label, line }: { label: string; line: string }) {
  return (
    <Card>
      <a
        href={waShareUrl(`${line} ${appUrl()}`)}
        target="_blank"
        rel="noreferrer"
        style={primaryLink}
      >
        {label}
      </a>
    </Card>
  )
}
