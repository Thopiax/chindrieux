import type { Person } from './types.ts'

// ISO yyyy-mm-dd strings compare lexicographically, so date math needs no parsing.
export function isPresentOn(p: Person, date: string): boolean {
  if (p.arrival === null || p.departure === null) return false
  return p.arrival <= date && date <= p.departure
}

export function presentOn(people: Person[], date: string): Person[] {
  return people.filter((p) => isPresentOn(p, date))
}

// Days of [start, end] (inclusive) covered by p's stay; people without stay
// dates count as there the whole time.
export function stayOverlapDays(p: Person, start: string, end: string): number {
  if (p.arrival === null || p.departure === null) return daysUntil(start, end) + 1
  const from = p.arrival > start ? p.arrival : start
  const to = p.departure < end ? p.departure : end
  return to < from ? 0 : daysUntil(from, to) + 1
}

// Present at any point in [start, end]. Like presentOn, people without stay
// dates are excluded (we can't know), so they never get auto-ticked.
export function presentInRange(people: Person[], start: string, end: string): Person[] {
  return people.filter(
    (p) => p.arrival !== null && p.departure !== null && stayOverlapDays(p, start, end) > 0,
  )
}

// How many people are present on a given day.
export function headcountOn(people: Person[], date: string): number {
  return presentOn(people, date).length
}

export function tripRange(people: Person[]): { start: string; end: string } | null {
  const arrivals: string[] = []
  const departures: string[] = []
  for (const p of people) {
    if (p.arrival !== null) arrivals.push(p.arrival)
    if (p.departure !== null) departures.push(p.departure)
  }
  if (arrivals.length === 0 || departures.length === 0) return null
  return {
    start: arrivals.reduce((a, b) => (a < b ? a : b)),
    end: departures.reduce((a, b) => (a > b ? a : b)),
  }
}

export function tripPhase(people: Person[], today: string): 'before' | 'during' | 'after' {
  const range = tripRange(people)
  if (range === null) return 'before'
  if (today < range.start) return 'before'
  if (today > range.end) return 'after'
  return 'during'
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
export function daysUntil(today: string, start: string): number {
  return Math.round((Date.parse(start) - Date.parse(today)) / MS_PER_DAY)
}
