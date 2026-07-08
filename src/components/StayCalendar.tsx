import { useState } from 'react'
import { use$ } from '@legendapp/state/react'
import { lang$, useT } from '../i18n.ts'
import { addMonth, monthGrid, nextStay } from '../domain/stay.ts'
import { tripRange } from '../domain/presence.ts'
import { people$, useRows } from '../store.ts'
import { todayISO } from '../today.ts'

// Tap-tap range picker: tap arrival, tap departure, the stay paints between.
// Values are '' when unset, matching the onboarding form's string fields.
export function StayCalendar({
  arrival,
  departure,
  onChange,
}: {
  arrival: string
  departure: string
  onChange: (arrival: string, departure: string) => void
}) {
  const t = useT()
  const lang = use$(lang$)
  const people = useRows(people$)
  const today = todayISO()

  // Open where the action is: my own dates, else the crew's trip, else now.
  const [month, setMonth] = useState(() =>
    (arrival || tripRange(people)?.start || today).slice(0, 7),
  )

  const grid = monthGrid(month)
  const monthName = new Date(`${month}-15T12:00:00`).toLocaleDateString(lang, {
    month: 'long',
    year: 'numeric',
  })
  // 2024-01-01 was a Monday: a fixed week to derive localized initials.
  const weekdays = Array.from({ length: 7 }, (_, i) =>
    new Date(2024, 0, 1 + i, 12).toLocaleDateString(lang, { weekday: 'narrow' }),
  )

  const tap = (iso: string) => {
    const next = nextStay({ arrival: arrival || null, departure: departure || null }, iso)
    onChange(next.arrival ?? '', next.departure ?? '')
  }

  const fmt = (iso: string) =>
    new Date(`${iso}T12:00:00`).toLocaleDateString(lang, { day: 'numeric', month: 'short' })

  const navBtn = {
    fontFamily: 'inherit', fontWeight: 700, fontSize: 20, lineHeight: 1,
    minWidth: 44, minHeight: 44, cursor: 'pointer', background: 'none',
    border: 'none', color: 'var(--color-ink)',
  } as const

  return (
    <div style={{ border: '2px solid var(--color-ink)', borderRadius: 12, padding: 12, background: '#fff' }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <button type="button" onClick={() => setMonth((m) => addMonth(m, -1))} style={navBtn} aria-label="‹">
          ‹
        </button>
        <span style={{ flex: 1, textAlign: 'center', fontWeight: 700 }}>{monthName}</span>
        <button type="button" onClick={() => setMonth((m) => addMonth(m, 1))} style={navBtn} aria-label="›">
          ›
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {weekdays.map((w, i) => (
          <span key={i} aria-hidden style={{ textAlign: 'center', fontSize: 11, fontWeight: 700, opacity: 0.6 }}>
            {w}
          </span>
        ))}
        {grid.map((iso, i) => {
          if (!iso) return <span key={`pad-${i}`} />
          const inRange = arrival !== '' && departure !== '' && iso >= arrival && iso <= departure
          const isEndpoint = iso === arrival || iso === departure
          return (
            <button
              key={iso}
              type="button"
              onClick={() => tap(iso)}
              aria-pressed={isEndpoint || inRange}
              style={{
                fontFamily: 'inherit', fontWeight: iso === today || isEndpoint ? 800 : 600,
                fontSize: 14, minHeight: 40, cursor: 'pointer', borderRadius: 8,
                color: iso === today && !isEndpoint ? 'var(--color-tomato-text)' : 'var(--color-ink)',
                background: isEndpoint ? 'var(--color-sunny)' : inRange ? 'rgb(255 210 63 / .4)' : 'none',
                border: isEndpoint ? '2px solid var(--color-ink)' : '2px solid transparent',
              }}
            >
              {Number(iso.slice(8))}
            </button>
          )
        })}
      </div>

      <p style={{ margin: '10px 0 0', fontSize: 13, fontWeight: 700, textAlign: 'center', opacity: 0.75 }}>
        {arrival
          ? `${fmt(arrival)} → ${departure ? fmt(departure) : '?'}`
          : t('calendar.hint')}
      </p>
    </div>
  )
}
