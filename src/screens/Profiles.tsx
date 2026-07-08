import { useState, type ReactNode } from 'react'
import { use$ } from '@legendapp/state/react'
import { Badge } from '../components/Badge.tsx'
import { Card } from '../components/Card.tsx'
import { Screen } from '../components/Screen.tsx'
import { lang$, useT, type Lang } from '../i18n.ts'
import { myId$ } from '../identity.ts'
import { people$, useRows } from '../store.ts'
import { daysUntil, presentOn, tripPhase, tripRange } from '../domain/presence.ts'
import { appUrl, waShareUrl } from '../share.ts'
import { todayISO } from '../today.ts'
import type { Person } from '../domain/types.ts'
import { Onboarding, type OnboardingMode } from './Onboarding.tsx'
import { WhosHereSection } from './WhosHere.tsx'

type T = ReturnType<typeof useT>

// yyyy-mm-dd anchored at local noon so toLocaleDateString never drifts a day.
function fmtDate(iso: string, lang: Lang): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(lang, {
    day: 'numeric',
    month: 'short',
  })
}

const primaryBtn = {
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: 15,
  color: '#fff',
  background: 'var(--color-cerulean)',
  border: 'none',
  borderRadius: 9999,
  padding: '9px 18px',
  cursor: 'pointer',
} as const

const ghostBtn = {
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: 14,
  color: 'var(--color-ink)',
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '10px 12px',
  minHeight: 44,
} as const

export function Profiles() {
  const t = useT()
  const people = useRows(people$)
  const myId = use$(myId$)
  const [openId, setOpenId] = useState<string | null>(null)
  // When set, the onboarding flow takes over the screen for editing/adding.
  const [panel, setPanel] = useState<OnboardingMode | null>(null)
  const [bulkOpen, setBulkOpen] = useState(false)

  if (panel) return <Onboarding mode={panel} onDone={() => setPanel(null)} />

  const sorted = [...people].sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
  const open = openId ? sorted.find((p) => p.id === openId) ?? null : null

  return (
    <Screen title={t('profiles.title')}>
      <h2 className="marker-underline" style={{ marginTop: 0 }}>{t('whoshere.title')}</h2>
      <WhosHereSection />

      <CrewPulse t={t} people={people} />

      {sorted.length === 0 ? (
        <p style={{ marginBottom: 20 }}>{t('profiles.empty')}</p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {sorted.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-expanded={openId === p.id}
              onClick={() => setOpenId((cur) => (cur === p.id ? null : p.id))}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 8,
                opacity: open && openId !== p.id ? 0.5 : 1,
              }}
            >
              <Badge person={p} size="md" />
              <span style={{ fontWeight: 700 }}>
                {p.name}
                {p.id === myId ? ' ★' : ''}
              </span>
            </button>
          ))}
        </div>
      )}

      {open && (
        <ProfileCard
          t={t}
          person={open}
          isMe={open.id === myId}
          onClose={() => setOpenId(null)}
          onEdit={() => setPanel('edit')}
          onDelete={() => {
            people$[open.id].deleted.set(true)
            setOpenId(null)
          }}
        />
      )}

      <button type="button" className="big-red" onClick={() => setPanel('add')}>
        {t('profiles.addPerson')}
      </button>
      <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0 20px' }}>
        <button type="button" onClick={() => setBulkOpen((v) => !v)} style={ghostBtn}>
          {t('profiles.addMany')}
        </button>
      </div>
      {bulkOpen && <BulkAdd t={t} onDone={() => setBulkOpen(false)} />}
    </Screen>
  )
}

// Phase-aware cards at the top of Crew (moved from the old Today screen):
// countdown + share link before the trip, today's arrivals/departures during.
function CrewPulse({ t, people }: { t: T; people: Person[] }) {
  const today = todayISO()
  const phase = tripPhase(people, today)

  if (phase === 'before') {
    const range = tripRange(people)
    const missing = people.filter((p) => !p.avatar_emoji || !p.arrival || !p.departure)
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
        {range && (
          <Card>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 700, margin: 0 }}>
              {(() => {
                const n = daysUntil(today, range.start)
                return t(n === 1 ? 'today.daysToGo.one' : 'today.daysToGo', { n })
              })()}
            </p>
            {missing.length > 0 && (
              <p style={{ fontSize: 13, margin: '10px 0 0', opacity: 0.75 }}>
                {t('today.stillMissing', { names: missing.map((p) => p.name).join(', ') })}
              </p>
            )}
          </Card>
        )}
        <Card>
          <a
            href={waShareUrl(`${t('today.inviteLine')} ${appUrl()}`)}
            target="_blank"
            rel="noreferrer"
            style={{ ...primaryBtn, display: 'inline-block', textDecoration: 'none' }}
          >
            {t('today.shareLink')}
          </a>
        </Card>
      </div>
    )
  }

  if (phase === 'during') {
    const groups: { key: string; people: Person[] }[] = [
      { key: 'today.arrivingToday', people: people.filter((p) => p.arrival === today) },
      { key: 'today.leavingToday', people: people.filter((p) => p.departure === today) },
      { key: 'today.hereNow', people: presentOn(people, today) },
    ].filter((g) => g.people.length > 0)
    if (groups.length === 0) return null
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 28 }}>
        {groups.map((g) => (
          <Card key={g.key}>
            <p style={{ fontWeight: 700, margin: '0 0 10px', fontSize: 15 }}>{t(g.key)}</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {g.people.map((p) => <Badge key={p.id} person={p} size="sm" />)}
            </div>
          </Card>
        ))}
      </div>
    )
  }

  return null
}

// Paste-a-list flow: one name per line (or commas) creates bare person rows.
// Each guest finishes their own badge later via "That's me" on first open.
function BulkAdd({ t, onDone }: { t: T; onDone: () => void }) {
  const [text, setText] = useState('')
  const names = text
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter((s) => s !== '')

  const add = () => {
    for (const name of names) {
      const id = crypto.randomUUID()
      const row: Person = {
        id, name, avatar_emoji: null, avatar_color: null, iban: null,
        arrival: null, departure: null, blaze: null, drink: null, has_car: null,
        world_cup_team: null, mode: null,
      }
      people$[id].set(row)
    }
    setText('')
    onDone()
  }

  return (
    <Card style={{ marginTop: 16 }}>
      <label style={{ display: 'block', fontWeight: 700, marginBottom: 12 }}>
        {t('profiles.addManyHint')}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder={'Ana\nBruno\nChloé'}
          style={{
            display: 'block', width: '100%', boxSizing: 'border-box', marginTop: 8,
            fontFamily: 'inherit', fontSize: 16, padding: '10px 12px',
            borderRadius: 8, border: '2px solid var(--color-ink)', resize: 'vertical',
          }}
        />
      </label>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" onClick={onDone} className="back-chip">
          {t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={add}
          disabled={names.length === 0}
          style={{ ...primaryBtn, flex: 1, opacity: names.length === 0 ? 0.4 : 1 }}
        >
          {t('common.add')}{names.length > 0 ? ` (${names.length})` : ''}
        </button>
      </div>
    </Card>
  )
}

function ProfileCard({
  t,
  person,
  isMe,
  onClose,
  onEdit,
  onDelete,
}: {
  t: T
  person: Person
  isMe: boolean
  onClose: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  const lang = use$(lang$)
  const [pendingDelete, setPendingDelete] = useState(false)
  const vibes: { on: boolean; emoji: string; label: string }[] = [
    { on: person.blaze ?? false, emoji: '🌿', label: t('onboarding.vibes.blaze') },
    { on: person.drink ?? false, emoji: '🍺', label: t('onboarding.vibes.drink') },
    { on: person.has_car ?? false, emoji: '🚗', label: t('onboarding.vibes.hasCar') },
  ].filter((v) => v.on)
  const mode = person.mode ?? 50

  return (
    <Card style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <Badge person={person} size="md" />
        <strong style={{ fontSize: 20, flex: 1 }}>{person.name}</strong>
        <button type="button" onClick={onClose} aria-label={t('common.close')} style={ghostBtn}>
          ✕
        </button>
      </div>

      <p style={{ margin: '0 0 12px', fontWeight: 700 }}>
        📍{' '}
        {person.arrival && person.departure
          ? `${fmtDate(person.arrival, lang)} → ${fmtDate(person.departure, lang)}`
          : t('profiles.datesTbd')}
      </p>

      {(vibes.length > 0 || person.world_cup_team) && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
          {vibes.map((v) => (
            <Chip key={v.label}>
              {v.emoji} {v.label}
            </Chip>
          ))}
          {person.world_cup_team && <Chip>⚽ {person.world_cup_team}</Chip>}
        </div>
      )}

      <div>
        <p style={{ margin: '0 0 6px', fontWeight: 700 }}>{t('onboarding.vibes.workChill')}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13 }}>{t('onboarding.work')}</span>
          <div
            role="meter"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={mode}
            aria-label={t('onboarding.vibes.workChill')}
            style={{
              position: 'relative',
              flex: 1,
              height: 10,
              borderRadius: 9999,
              background: 'var(--color-paper)',
              border: '2px solid var(--color-ink)',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: '50%',
                left: `${mode}%`,
                width: 16,
                height: 16,
                borderRadius: 9999,
                background: 'var(--color-sunny)',
                border: '2px solid var(--color-ink)',
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
          <span style={{ fontSize: 13 }}>{t('onboarding.chill')}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 16 }}>
        {/* ponytail: identity is per-device (myId$ isn't synced), so "claimed by
            someone else" is unknowable — only your own row is editable. To fix
            someone else's typo: delete + re-add, or hand them the link. */}
        {isMe && (
          <button type="button" onClick={onEdit} style={primaryBtn}>
            {t('profiles.editMyProfile')}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            if (pendingDelete) onDelete()
            else setPendingDelete(true)
          }}
          style={{ ...ghostBtn, color: 'var(--color-tomato-text)' }}
        >
          {pendingDelete ? t('profiles.tapAgainDelete') : t('common.delete')}
        </button>
      </div>
    </Card>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontWeight: 700,
        fontSize: 14,
        padding: '4px 10px',
        borderRadius: 9999,
        background: 'var(--color-sunny)',
        border: '2px solid var(--color-ink)',
      }}
    >
      {children}
    </span>
  )
}
