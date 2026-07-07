import { useState, type ReactNode } from 'react'
import { use$ } from '@legendapp/state/react'
import { Badge } from '../components/Badge.tsx'
import { Card } from '../components/Card.tsx'
import { Screen } from '../components/Screen.tsx'
import { lang$, useT, type Lang } from '../i18n.ts'
import { myId$ } from '../identity.ts'
import { people$, useRows } from '../store.ts'
import type { Person } from '../domain/types.ts'
import { Onboarding, type OnboardingMode } from './Onboarding.tsx'

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
  padding: 4,
} as const

export function Profiles() {
  const t = useT()
  const people = useRows(people$)
  const myId = use$(myId$)
  const [openId, setOpenId] = useState<string | null>(null)
  // When set, the onboarding flow takes over the screen for editing/adding.
  const [panel, setPanel] = useState<OnboardingMode | null>(null)

  if (panel) return <Onboarding mode={panel} onDone={() => setPanel(null)} />

  const sorted = [...people].sort((a, b) => a.name.localeCompare(b.name))
  const open = openId ? sorted.find((p) => p.id === openId) ?? null : null

  return (
    <Screen title={t('profiles.title')}>
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
        />
      )}

      <button type="button" onClick={() => setPanel('add')} style={primaryBtn}>
        {t('profiles.addPerson')}
      </button>
    </Screen>
  )
}

function ProfileCard({
  t,
  person,
  isMe,
  onClose,
  onEdit,
}: {
  t: T
  person: Person
  isMe: boolean
  onClose: () => void
  onEdit: () => void
}) {
  const lang = use$(lang$)
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

      {isMe && (
        <button type="button" onClick={onEdit} style={{ ...primaryBtn, marginTop: 16 }}>
          {t('profiles.editMyProfile')}
        </button>
      )}
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
