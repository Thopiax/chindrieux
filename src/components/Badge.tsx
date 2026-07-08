import { useState } from 'react'
import type { Person } from '../domain/types.ts'

type Size = 'sm' | 'md' | 'lg'

// Badge only needs a person's name and avatar bits, so it accepts a subset.
// This lets the onboarding preview pass a half-built person before it is saved.
type BadgePerson = Pick<Person, 'name' | 'avatar_emoji' | 'avatar_color'>

const dims: Record<Size, { box: number; font: number }> = {
  sm: { box: 40, font: 20 },
  md: { box: 64, font: 32 },
  lg: { box: 96, font: 52 },
}

const DEFAULT_COLOR = '#C9C4B5'

// Emoji in a colored ring. Falls back to the name's first letter when no emoji
// is chosen yet, and to a neutral grey when no color is chosen yet.
export function Badge({ person, size = 'md' }: { person: BadgePerson; size?: Size }) {
  const { box, font } = dims[size]
  // ponytail: tap toggles the name bubble; no auto-hide, tapping again dismisses.
  const [named, setNamed] = useState(false)
  const color = person.avatar_color ?? DEFAULT_COLOR
  // Guarded: a partially-synced row can render for a frame with name undefined.
  const letter = (person.name ?? '').trim().slice(0, 1).toUpperCase() || '?'
  return (
    <span
      role="img"
      aria-label={person.name || letter}
      title={person.name}
      className="badge-pin"
      onClick={(e) => {
        e.stopPropagation()
        setNamed((v) => !v)
      }}
      style={{ width: box, height: box, color, background: color, fontSize: font, lineHeight: 1, position: 'relative', cursor: 'pointer' }}
    >
      {person.avatar_emoji ?? (
        <span style={{ color: '#fff', fontWeight: 800 }}>{letter}</span>
      )}
      {named && person.name && <span className="badge-name">{person.name}</span>}
    </span>
  )
}
