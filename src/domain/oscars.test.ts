import { describe, expect, test } from 'vitest'
import type { Nomination, Vote } from './types.ts'
import { tally, winners } from './oscars.ts'

function vote(id: string, category_id: string, nomination_id: string, voter_id: string): Vote {
  return { id, category_id, nomination_id, voter_id }
}
function nomination(id: string, category_id: string, created_at: string): Nomination {
  return { id, category_id, title: id, photo_url: null, proposed_by: 'x', created_at }
}

describe('tally', () => {
  test('counts votes per nomination in a category', () => {
    const votes = [
      vote('v1', 'c1', 'n1', 'a'),
      vote('v2', 'c1', 'n1', 'b'),
      vote('v3', 'c1', 'n2', 'c'),
      vote('v4', 'c2', 'n3', 'd'),
    ]
    const t = tally(votes, 'c1')
    expect(t.get('n1')).toBe(2)
    expect(t.get('n2')).toBe(1)
    expect(t.has('n3')).toBe(false)
  })
})

describe('winners', () => {
  const nominations = [
    nomination('n1', 'c1', '2026-07-10T10:00:00Z'),
    nomination('n2', 'c1', '2026-07-10T09:00:00Z'),
    nomination('n3', 'c2', '2026-07-10T08:00:00Z'),
  ]

  test('picks the nomination with most votes', () => {
    const votes = [
      vote('v1', 'c1', 'n1', 'a'),
      vote('v2', 'c1', 'n1', 'b'),
      vote('v3', 'c1', 'n2', 'c'),
    ]
    expect(winners(votes, nominations).get('c1')).toBe('n1')
  })

  test('tie resolves to earliest nomination by created_at', () => {
    const votes = [
      vote('v1', 'c1', 'n1', 'a'),
      vote('v2', 'c1', 'n2', 'b'),
    ]
    // n1 and n2 both have 1 vote; n2 was created earlier so it wins
    expect(winners(votes, nominations).get('c1')).toBe('n2')
  })

  test('no votes yields null for the category', () => {
    expect(winners([], nominations).get('c2')).toBeNull()
  })
})
