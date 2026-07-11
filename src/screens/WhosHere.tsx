import { use$ } from '@legendapp/state/react'
import { Badge } from '../components/Badge.tsx'
import { Card } from '../components/Card.tsx'
import { lang$, useT, type Lang } from '../i18n.ts'
import { people$, useRows } from '../store.ts'
import { arrivingOn, departingOn, headcountOn, presentOn, tripRange } from '../domain/presence.ts'
import { eachDay } from '../domain/stay.ts'
import type { Person } from '../domain/types.ts'
import { todayISO } from '../today.ts'

// ponytail: CSS grid, not a calendar lib

const BAR_FALLBACK = '#C9C4B5'
const DAY_COL_PX = 44
const BLEED_PX = 20 // must match <main>'s side padding in App.tsx

// ponytail: hardcoded summer-2026 event dates; edit for the next trip
const MARKERS: Record<string, { emoji: string; key: string }> = {
  '2026-07-12': { emoji: '🎂', key: 'whoshere.markerLaeti' },
  '2026-07-14': { emoji: '🇫🇷⚽', key: 'whoshere.marker14juillet' },
  '2026-07-15': { emoji: '⚽', key: 'whoshere.markerSemi' },
  '2026-07-19': { emoji: '🏆', key: 'whoshere.markerFinal' },
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

// Embedded in the Crew tab (no screen wrapper of its own).
export function WhosHereSection() {
  const t = useT()
  const lang = use$(lang$)
  const people = useRows(people$)

  const dated = people
    .filter((p) => p.arrival && p.departure)
    .sort((a, b) => a.arrival!.localeCompare(b.arrival!))
  const undated = people.filter((p) => !p.arrival || !p.departure)

  const range = tripRange(dated)
  const days = range ? eachDay(range.start, range.end) : []
  const today = todayISO()
  const todayCol = days.indexOf(today) // -1 when today is outside the trip
  // Row 1 is the day header, row 2 the daily headcount, people are rows 3..n.
  const lastRow = dated.length + 2
  const markerDays = days.filter((d) => MARKERS[d])

  const hereToday = presentOn(dated, today)
  const arriving = dated.filter((p) => p.arrival === today)
  const leaving = dated.filter((p) => p.departure === today)

  // Days where someone arrives or leaves, in trip order.
  const movements = days
    .map((d) => ({ day: d, arrivals: arrivingOn(dated, d), departures: departingOn(dated, d) }))
    .filter((m) => m.arrivals.length > 0 || m.departures.length > 0)

  return (
    <section>
      {people.length > 0 && (
        <p style={crewLine}>
          {t(people.length === 1 ? 'whoshere.crewTotal.one' : 'whoshere.crewTotal', {
            n: people.length,
          })}
        </p>
      )}

      {days.length > 0 && dated.length > 0 ? (
        <>
        {/* Today at a glance: crew count + who arrives/leaves. Only mid-trip. */}
        {todayCol >= 0 && (
          <p style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700 }}>
            {[
              `👥 ${hereToday.length} ${t('today.hereNow').toLowerCase()}`,
              arriving.length > 0 ? `👋 ${arriving.map((p) => p.name).join(', ')}` : null,
              leaving.length > 0 ? `🧳 ${leaving.map((p) => p.name).join(', ')}` : null,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {/* Every arrival and departure of the trip, day by day. */}
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
        {/* Full bleed: cancel the page's side padding so the chart scrolls edge to edge. */}
        <div
          style={{
            overflowX: 'auto',
            margin: `0 -${BLEED_PX}px ${markerDays.length > 0 ? 8 : 24}px`,
            padding: `0 ${BLEED_PX}px 4px`,
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${days.length}, 1fr)`,
              columnGap: 0,
              rowGap: 8,
              alignItems: 'center',
              position: 'relative',
              minWidth: days.length * DAY_COL_PX,
            }}
          >
            {/* Today gets a translucent sunny wash down the whole column. */}
            {todayCol >= 0 && (
              <div
                aria-hidden
                style={{
                  gridColumn: 1 + todayCol,
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

            {/* Event days get a translucent cerulean wash, mirroring the today one. */}
            {days.map((d, i) =>
              MARKERS[d] ? (
                <div
                  key={`marker-${d}`}
                  aria-hidden
                  style={{
                    gridColumn: 1 + i,
                    gridRow: `1 / ${lastRow + 1}`,
                    alignSelf: 'stretch',
                    background: 'var(--color-cerulean)',
                    opacity: 0.18,
                    borderRadius: 8,
                    pointerEvents: 'none',
                    zIndex: 5,
                  }}
                />
              ) : null,
            )}

            {/* Header row: one cell per day. */}
            {days.map((d, i) => (
              <div key={d} style={{ gridColumn: 1 + i, gridRow: 1, textAlign: 'center' }}>
                <div style={{ fontSize: 11, textTransform: 'uppercase', opacity: 0.7 }}>
                  {weekdayNarrow(d, lang)}
                </div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{dayNumber(d)}</div>
                {MARKERS[d] && (
                  <div style={{ fontSize: 11, lineHeight: 1.3 }}>{MARKERS[d].emoji}</div>
                )}
              </div>
            ))}

            {/* Headcount row: how many people are here on each day. */}
            {days.map((d, i) => {
              const n = headcountOn(dated, d)
              return (
                <div
                  key={`count-${d}`}
                  style={{ gridColumn: 1 + i, gridRow: 2, textAlign: 'center', zIndex: 6 }}
                >
                  <span
                    aria-label={t('whoshere.peopleOnDay', { n })}
                    style={{
                      display: 'inline-block',
                      minWidth: 22,
                      padding: '2px 6px',
                      borderRadius: 9999,
                      fontSize: 13,
                      fontWeight: 700,
                      background: 'var(--color-ink)',
                      color: 'var(--color-paper)',
                    }}
                  >
                    {n}
                  </span>
                </div>
              )
            })}

            {/* One row per person: a bar across their stay, name on the bar. */}
            {dated.map((p, r) => {
              const from = days.indexOf(p.arrival!)
              const to = days.indexOf(p.departure!)
              const row = 3 + r
              return (
                  <div
                    key={p.id}
                    style={{
                      gridColumn: `${1 + from} / ${2 + to}`,
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
                    {/* Sticky within the bar: the label rides along on horizontal
                        scroll but can never leave its own bar. */}
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        minWidth: 0,
                        position: 'sticky',
                        left: BLEED_PX,
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
                    </span>
                  </div>
              )
            })}
          </div>
        </div>
        {markerDays.length > 0 && (
          <p style={{ margin: '0 0 24px', fontSize: 12, fontWeight: 700, opacity: 0.75 }}>
            {markerDays.map((d) => `${MARKERS[d].emoji} ${t(MARKERS[d].key)}`).join(' · ')}
          </p>
        )}
        </>
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
    </section>
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
