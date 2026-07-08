import type { Nomination, Vote } from './types.ts'

// Vote count per nomination within a single category.
export function tally(votes: Vote[], categoryId: string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const v of votes) {
    if (v.category_id !== categoryId) continue
    counts.set(v.nomination_id, (counts.get(v.nomination_id) ?? 0) + 1)
  }
  return counts
}

// Winning nomination per category. Ties break toward the earliest nomination by
// created_at; a category with no votes maps to null.
export function winners(votes: Vote[], nominations: Nomination[]): Map<string, string | null> {
  const createdAt = new Map(nominations.map((n) => [n.id, n.created_at ?? '']))
  const out = new Map<string, string | null>()
  const categoryIds = new Set(nominations.map((n) => n.category_id))
  for (const v of votes) categoryIds.add(v.category_id)

  for (const categoryId of categoryIds) {
    const counts = tally(votes, categoryId)
    let winner: string | null = null
    let best = 0
    for (const [nominationId, count] of counts) {
      if (
        count > best
        || (count === best && winner !== null
          && (createdAt.get(nominationId) ?? '') < (createdAt.get(winner) ?? ''))
      ) {
        winner = nominationId
        best = count
      }
    }
    out.set(categoryId, winner)
  }
  return out
}
