import { Fragment } from 'react'
import { use$ } from '@legendapp/state/react'
import { Badge } from '../components/Badge.tsx'
import { Card } from '../components/Card.tsx'
import { Screen } from '../components/Screen.tsx'
import { lang$, useT, type Lang } from '../i18n.ts'
import { people$, useRows } from '../store.ts'
import { arrivingOn, departingOn, headcountOn, tripRange } from '../domain/presence.ts'
import type { Person } from '../domain/types.ts'
import { todayISO } from '../today.ts'

// ponytail: CSS grid, not a calendar lib

const BAR_FALLBACK = '#C9C4B5'
const DAY_COL_PX = 44
const NAME_COL_PX = 80

// yyyy-mm-dd from a local Date. Kept local (not toISOString) so a day never
// drifts across the UTC boundary.
function isoOf(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Inclusive list of yyyy-mm-dd from start to end, anchored at noon so adding a
// day never lands on a DST seam. Returns [] when start > end (degenerate range).
function eachDay(start: string, end: string): string[] {
  const out: string[] = []
  const cur = new Date(`${start}T12:00:00`)
  const last = new Date(`${end}T12:00:00`)
  while (cur <= last) {
    out.push(isoOf(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

function weekdayNarrow(iso: string, lang: Lang): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(lang, { weekday: 'narrow' })
}

function dayNumber(iso: string): number {
  return new Date(`${iso}T12:00:00`).getDate()
}

// e.g. "Fri 11" — weekday plus day-of-month, for the movements list.
function dayLabel(iso: string, lang: Lang): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(lang, { weekday: 'short', day: 'numeric' })
}

type T = ReturnType<typeof useT>

export function WhosHere() {
  const t = useT()
  const lang = use$(lang$)
  const people = useRows(people$)

  const dated = people
    .filter((p) => p.arrival && p.departure)
    .sort((a, b) => a.arrival!.localeCompare(b.arrival!))
  const undated = people.filter((p) => !p.arrival || !p.departure)

  const range = tripRange(dated)
  const days = range ? eachDay(range.start, range.end) : []
  const hasChart = days.length > 0 && dated.length > 0

  // Days where someone arrives or leaves, in trip order.
  const movements = days
    .map((d) => ({ day: d, arrivals: arrivingOn(dated, d), departures: departingOn(dated, d) }))
    .filter((m) => m.arrivals.length > 0 || m.departures.length > 0)

  return (
    <Screen title={t('whoshere.title')}>
      {people.length > 0 && (
        <p style={crewLine}>
          {t(people.length === 1 ? 'whoshere.crewTotal.one' : 'whoshere.crewTotal', {
            n: people.length,
          })}
        </p>
      )}

      {movements.length > 0 && (
        <Card style={{ marginBottom: 20 }}>
          <h2 style={sectionHeading}>{t('whoshere.movementsTitle')}</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {movements.map((m) => (
              <div key={m.day} style={movementRow}>
                <span style={movementDay}>{dayLabel(m.day, lang)}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, flex: 1 }}>
                  {m.arrivals.length > 0 && <MovementGroup icon="👋" people={m.arrivals} />}
                  {m.departures.length > 0 && <MovementGroup icon="🧳" people={m.departures} />}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {hasChart ? (
        <Card style={{ marginBottom: 20 }}>
          <h2 style={sectionHeading}>{t('whoshere.hereEachDay')}</h2>
          <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
            <div style={{ display: 'flex', gap: 6, minWidth: 'min-content' }}>
              {days.map((d) => (
                <HeadcountCell
                  key={d}
                  iso={d}
                  lang={lang}
                  count={headcountOn(dated, d)}
                  isToday={d === todayISO()}
                  label={t('whoshere.peopleOnDay', { n: headcountOn(dated, d) })}
                />
              ))}
            </div>
          </div>
        </Card>
      ) : (
        <p style={{ marginBottom: 24 }}>{t('whoshere.empty')}</p>
      )}

      {undated.length > 0 && (
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>{t('whoshere.needDatesTitle')}</h2>
          {undated.map((p) => (
            <UndatedRow key={p.id} person={p} t={t} />
          ))}
        </section>
      )}

      {hasChart && <StayGrid dated={dated} days={days} />}
    </Screen>
  )
}

function MovementGroup({ icon, people }: { icon: string; people: Person[] }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
      <span aria-hidden>{icon}</span>
      {people.map((p) => (
        <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Badge person={p} size="sm" />
          <span style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</span>
        </span>
      ))}
    </span>
  )
}

function HeadcountCell({
  iso, lang, count, isToday, label,
}: { iso: string; lang: Lang; count: number; isToday: boolean; label: string }) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        minWidth: DAY_COL_PX, padding: '6px 4px', borderRadius: 12,
        background: isToday ? 'var(--color-sunny)' : 'transparent',
      }}
    >
      <span style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.7 }}>
        {weekdayNarrow(iso, lang)}
      </span>
      <span style={{ fontSize: 13, fontWeight: 700 }}>{dayNumber(iso)}</span>
      <span
        aria-label={label}
        style={{
          display: 'inline-block', minWidth: 24, padding: '2px 6px', borderRadius: 9999,
          fontSize: 14, fontWeight: 700, textAlign: 'center',
          background: 'var(--color-ink)', color: 'var(--color-paper)',
        }}
      >
        {count}
      </span>
    </div>
  )
}

// The Gantt-style grid of stay bars: one row per person across the trip days.
function StayGrid({ dated, days }: { dated: Person[]; days: string[] }) {
  const lang = use$(lang$)
  const todayCol = days.indexOf(todayISO()) // -1 when today is outside the trip
  const lastRow = dated.length + 1 // header is row 1, people are rows 2..n

  return (
    <div style={{ overflowX: 'auto', paddingBottom: 4 }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `${NAME_COL_PX}px repeat(${days.length}, 1fr)`,
          columnGap: 0,
          rowGap: 8,
          alignItems: 'center',
          position: 'relative',
          minWidth: NAME_COL_PX + days.length * DAY_COL_PX,
        }}
      >
        {/* Today gets a translucent sunny wash down the whole column. */}
        {todayCol >= 0 && (
          <div
            aria-hidden
            style={{
              gridColumn: 2 + todayCol,
              gridRow: `1 / ${lastRow + 1}`,
              alignSelf: 'stretch',
              background: 'var(--color-sunny)',
              opacity: 0.32,
              borderRadius: 8,
              pointerEvents: 'none',
              zIndex: 5,
            }}
          />
        )}

        {/* Header row: corner + one cell per day. */}
        <div style={cornerCell} />
        {days.map((d, i) => (
          <div key={d} style={{ gridColumn: 2 + i, gridRow: 1, textAlign: 'center' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.7 }}>
              {weekdayNarrow(d, lang)}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700 }}>{dayNumber(d)}</div>
          </div>
        ))}

        {/* One row per person: sticky name cell + a bar across their stay. */}
        {dated.map((p, r) => {
          const from = days.indexOf(p.arrival!)
          const to = days.indexOf(p.departure!)
          const row = 2 + r
          return (
            <Fragment key={p.id}>
              <div style={{ ...nameCell, gridRow: row }}>{p.name}</div>
              <div
                style={{
                  gridColumn: `${2 + from} / ${3 + to}`,
                  gridRow: row,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  height: 40,
                  paddingRight: 10,
                  borderRadius: 9999,
                  background: p.avatar_color ?? BAR_FALLBACK,
                  color: 'var(--color-ink)',
                  fontWeight: 700,
                  fontSize: 13,
                  zIndex: 1,
                }}
              >
                <Badge person={p} size="sm" />
                <span
                  style={{
                    minWidth: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.name}
                </span>
              </div>
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}

function UndatedRow({ person, t }: { person: Person; t: T }) {
  return (
    <Card style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <Badge person={person} size="sm" />
        <strong style={{ flex: 1 }}>{person.name}</strong>
        <span style={{ fontSize: 13, opacity: 0.7 }}>{t('whoshere.setYourDates')}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        <label style={dateField}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{t('onboarding.arrival')}</span>
          <input
            type="date"
            value={person.arrival ?? ''}
            max={person.departure ?? undefined}
            onChange={(e) => people$[person.id].assign({ arrival: e.target.value || null })}
            style={dateInput}
          />
        </label>
        <label style={dateField}>
          <span style={{ fontSize: 12, fontWeight: 700 }}>{t('onboarding.departure')}</span>
          <input
            type="date"
            value={person.departure ?? ''}
            min={person.arrival ?? undefined}
            onChange={(e) => people$[person.id].assign({ departure: e.target.value || null })}
            style={dateInput}
          />
        </label>
      </div>
    </Card>
  )
}

const crewLine = {
  fontFamily: 'var(--font-display)',
  fontSize: 24,
  fontWeight: 700,
  margin: '0 0 20px',
} as const

const sectionHeading = {
  fontSize: 15,
  fontWeight: 700,
  margin: '0 0 12px',
} as const

const movementRow = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 12,
} as const

const movementDay = {
  minWidth: 56,
  fontSize: 13,
  fontWeight: 700,
  textTransform: 'capitalize',
  opacity: 0.8,
} as const

const cornerCell = {
  gridColumn: 1,
  gridRow: 1,
  position: 'sticky',
  left: 0,
  background: 'var(--color-paper)',
  zIndex: 4,
} as const

const nameCell = {
  gridColumn: 1,
  position: 'sticky',
  left: 0,
  background: 'var(--color-paper)',
  paddingRight: 8,
  fontSize: 13,
  fontWeight: 700,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  zIndex: 4,
} as const

const dateField = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
} as const

const dateInput = {
  fontFamily: 'inherit',
  fontSize: 14,
  padding: '6px 8px',
  borderRadius: 8,
  border: '2px solid var(--color-ink)',
  background: '#fff',
  color: 'var(--color-ink)',
} as const
