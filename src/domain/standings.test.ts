import { describe, expect, test } from 'vitest'
import type { Match } from './types.ts'
import { standings } from './standings.ts'

function match(id: string, winner_id: string, loser_id: string): Match {
  return { id, tournament_id: 't', winner_id, loser_id, played_at: '2026-07-10' }
}

describe('standings', () => {
  test('counts wins and losses', () => {
    const rows = standings([
      match('m1', 'a', 'b'),
      match('m2', 'a', 'c'),
      match('m3', 'b', 'c'),
    ])
    const byId = new Map(rows.map((r) => [r.personId, r]))
    expect(byId.get('a')).toEqual({ personId: 'a', wins: 2, losses: 0 })
    expect(byId.get('b')).toEqual({ personId: 'b', wins: 1, losses: 1 })
    expect(byId.get('c')).toEqual({ personId: 'c', wins: 0, losses: 2 })
  })

  test('sorts by wins desc then win pct desc', () => {
    const rows = standings([
      match('m1', 'a', 'b'),
      match('m2', 'a', 'c'),
      match('m3', 'b', 'a'),
      match('m4', 'c', 'a'),
      // b: 1 win, 1 loss (50%); c: 1 win, 1 loss (50%); a: 2 wins, 2 losses (50%)
    ])
    // a has most wins so ranks first
    expect(rows[0].personId).toBe('a')
  })

  test('higher win pct ranks above equal-win lower pct', () => {
    const rows = standings([
      // x: 2 wins, 0 losses (100%)
      match('m1', 'x', 'z'),
      match('m2', 'x', 'z'),
      // y: 2 wins, 2 losses (50%)
      match('m3', 'y', 'z'),
      match('m4', 'y', 'z'),
      match('m5', 'z', 'y'),
      match('m6', 'z', 'y'),
    ])
    expect(rows[0].personId).toBe('x')
  })

  test('empty matches yield empty standings', () => {
    expect(standings([])).toEqual([])
  })
})
