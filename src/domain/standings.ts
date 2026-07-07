import type { Match } from './types.ts'

type Standing = { personId: string; wins: number; losses: number }

// Sorted by wins descending, then by win percentage descending.
export function standings(matches: Match[]): Standing[] {
  const rows = new Map<string, Standing>()
  const get = (id: string): Standing => {
    let row = rows.get(id)
    if (row === undefined) {
      row = { personId: id, wins: 0, losses: 0 }
      rows.set(id, row)
    }
    return row
  }
  for (const m of matches) {
    get(m.winner_id).wins += 1
    get(m.loser_id).losses += 1
  }
  const pct = (r: Standing): number => {
    const played = r.wins + r.losses
    return played === 0 ? 0 : r.wins / played
  }
  return [...rows.values()].sort((a, z) => z.wins - a.wins || pct(z) - pct(a))
}
