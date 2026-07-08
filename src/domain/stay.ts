// Stay-range selection and day math, shared by the StayCalendar picker and
// the who's-here grid.

export type Stay = { arrival: string | null; departure: string | null }

// Tap-tap state machine: first tap sets arrival, a second tap on or after it
// sets departure (same day = one-day stay), anything else restarts the
// selection at the tapped day.
export function nextStay(current: Stay, tapped: string): Stay {
  const { arrival, departure } = current
  if (arrival && !departure && tapped >= arrival) return { arrival, departure: tapped }
  return { arrival: tapped, departure: null }
}

// yyyy-mm-dd from a local Date. Kept local (not toISOString) so a day never
// drifts across the UTC boundary.
export function isoOf(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

// Inclusive list of yyyy-mm-dd from start to end, anchored at noon so adding a
// day never lands on a DST seam. Returns [] when start > end (degenerate range).
export function eachDay(start: string, end: string): string[] {
  const out: string[] = []
  const cur = new Date(`${start}T12:00:00`)
  const last = new Date(`${end}T12:00:00`)
  while (cur <= last) {
    out.push(isoOf(cur))
    cur.setDate(cur.getDate() + 1)
  }
  return out
}

// Monday-first month grid for a 'yyyy-mm' month: leading nulls pad the first
// week, then one iso date per day of the month.
export function monthGrid(month: string): (string | null)[] {
  const [y, m] = month.split('-').map(Number)
  const first = new Date(y, m - 1, 1, 12)
  const lead = (first.getDay() + 6) % 7
  const daysInMonth = new Date(y, m, 0).getDate()
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => isoOf(new Date(y, m - 1, i + 1, 12))),
  ]
}

// 'yyyy-mm' cursor arithmetic for the ‹ › month nav.
export function addMonth(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1, 12)
  return isoOf(d).slice(0, 7)
}
