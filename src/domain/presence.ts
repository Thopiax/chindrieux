import type { Person } from './types.ts'

// ISO yyyy-mm-dd strings compare lexicographically, so date math needs no parsing.
export function isPresentOn(p: Person, date: string): boolean {
  if (p.arrival === null || p.departure === null) return false
  return p.arrival <= date && date <= p.departure
}

export function presentOn(people: Person[], date: string): Person[] {
  return people.filter((p) => isPresentOn(p, date))
}

// How many people are present on a given day.
export function headcountOn(people: Person[], date: string): number {
  return presentOn(people, date).length
}

// People whose stay starts on a given day.
export function arrivingOn(people: Person[], date: string): Person[] {
  return people.filter((p) => p.arrival === date)
}

// People whose stay ends on a given day.
export function departingOn(people: Person[], date: string): Person[] {
  return people.filter((p) => p.departure === date)
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
