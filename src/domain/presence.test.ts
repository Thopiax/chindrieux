import { describe, expect, test } from 'vitest'
import type { Person } from './types.ts'
import { arrivingOn, daysUntil, departingOn, headcountOn, isPresentOn, presentOn, tripPhase, tripRange } from './presence.ts'

function person(id: string, arrival: string | null, departure: string | null): Person {
  return {
    id, name: id,
    avatar_emoji: null, avatar_color: null, iban: null,
    arrival, departure,
    blaze: null, drink: null, has_car: null, world_cup_team: null, mode: null,
  }
}

describe('isPresentOn', () => {
  const p = person('a', '2026-07-10', '2026-07-14')

  test('arrival day counts as present', () => {
    expect(isPresentOn(p, '2026-07-10')).toBe(true)
  })
  test('departure day counts as present', () => {
    expect(isPresentOn(p, '2026-07-14')).toBe(true)
  })
  test('a day in the middle is present', () => {
    expect(isPresentOn(p, '2026-07-12')).toBe(true)
  })
  test('the day before arrival is absent', () => {
    expect(isPresentOn(p, '2026-07-09')).toBe(false)
  })
  test('the day after departure is absent', () => {
    expect(isPresentOn(p, '2026-07-15')).toBe(false)
  })
  test('missing arrival means absent', () => {
    expect(isPresentOn(person('b', null, '2026-07-14'), '2026-07-12')).toBe(false)
  })
  test('missing departure means absent', () => {
    expect(isPresentOn(person('b', '2026-07-10', null), '2026-07-12')).toBe(false)
  })
})

describe('presentOn', () => {
  test('returns only present people', () => {
    const people = [
      person('a', '2026-07-10', '2026-07-14'),
      person('b', '2026-07-13', '2026-07-20'),
      person('c', null, null),
    ]
    expect(presentOn(people, '2026-07-11').map((x) => x.id)).toEqual(['a'])
    expect(presentOn(people, '2026-07-13').map((x) => x.id)).toEqual(['a', 'b'])
  })
})

describe('headcountOn', () => {
  const people = [
    person('a', '2026-07-10', '2026-07-14'),
    person('b', '2026-07-13', '2026-07-20'),
    person('c', null, null),
  ]

  test('counts everyone present that day', () => {
    expect(headcountOn(people, '2026-07-13')).toBe(2)
  })
  test('counts a single present person', () => {
    expect(headcountOn(people, '2026-07-11')).toBe(1)
  })
  test('ignores people without dates', () => {
    expect(headcountOn(people, '2026-07-25')).toBe(0)
  })
})

describe('arrivingOn / departingOn', () => {
  const people = [
    person('a', '2026-07-10', '2026-07-14'),
    person('b', '2026-07-10', '2026-07-20'),
    person('c', null, null),
  ]

  test('arrivingOn returns people who start that day', () => {
    expect(arrivingOn(people, '2026-07-10').map((x) => x.id)).toEqual(['a', 'b'])
    expect(arrivingOn(people, '2026-07-14')).toEqual([])
  })
  test('departingOn returns people who end that day', () => {
    expect(departingOn(people, '2026-07-14').map((x) => x.id)).toEqual(['a'])
    expect(departingOn(people, '2026-07-10')).toEqual([])
  })
})

describe('tripRange', () => {
  test('min arrival to max departure', () => {
    const people = [
      person('a', '2026-07-10', '2026-07-14'),
      person('b', '2026-07-12', '2026-07-20'),
    ]
    expect(tripRange(people)).toEqual({ start: '2026-07-10', end: '2026-07-20' })
  })
  test('ignores people with missing dates', () => {
    const people = [
      person('a', '2026-07-10', '2026-07-14'),
      person('b', null, null),
    ]
    expect(tripRange(people)).toEqual({ start: '2026-07-10', end: '2026-07-14' })
  })
  test('null when nobody has a range', () => {
    expect(tripRange([person('a', null, null)])).toBeNull()
    expect(tripRange([])).toBeNull()
  })
})

describe('tripPhase', () => {
  const people = [person('a', '2026-07-10', '2026-07-14')]

  test('before the trip', () => {
    expect(tripPhase(people, '2026-07-09')).toBe('before')
  })
  test('during the trip (start boundary)', () => {
    expect(tripPhase(people, '2026-07-10')).toBe('during')
  })
  test('during the trip (end boundary)', () => {
    expect(tripPhase(people, '2026-07-14')).toBe('during')
  })
  test('after the trip', () => {
    expect(tripPhase(people, '2026-07-15')).toBe('after')
  })
  test('no range means before', () => {
    expect(tripPhase([], '2026-07-15')).toBe('before')
  })
})

describe('daysUntil', () => {
  test('counts whole days between dates', () => {
    expect(daysUntil('2026-07-06', '2026-07-10')).toBe(4)
  })
  test('same day is zero', () => {
    expect(daysUntil('2026-07-10', '2026-07-10')).toBe(0)
  })
  test('past start is negative', () => {
    expect(daysUntil('2026-07-12', '2026-07-10')).toBe(-2)
  })
})
