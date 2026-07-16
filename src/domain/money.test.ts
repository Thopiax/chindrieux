import { describe, expect, test } from 'vitest'
import type { Expense, Payment } from './types.ts'
import { balances, shares, suggestTransfers } from './money.ts'

function expense(
  id: string, payer_id: string, amount: number, participant_ids: string[],
  custom_shares: Record<string, number> | null = null,
): Expense {
  return {
    id, payer_id, amount, label: id, date: '2026-07-10',
    participant_ids, photo_url: null, custom_shares,
  }
}
function payment(id: string, from_id: string, to_id: string, amount: number): Payment {
  return { id, from_id, to_id, amount }
}
function bump(b: Map<string, number>, id: string, amount: number): void {
  b.set(id, (b.get(id) ?? 0) + amount)
}

describe('shares', () => {
  test('shares sum exactly to total with remainder cents', () => {
    const s = shares(1000, ['a', 'b', 'c'])
    expect([...s.values()].reduce((x, y) => x + y)).toBe(1000)
    expect([...s.values()].sort()).toEqual([333, 333, 334].sort())
  })
  test('remainder cents go to first participants', () => {
    const s = shares(1000, ['a', 'b', 'c'])
    expect(s.get('a')).toBe(334)
    expect(s.get('b')).toBe(333)
    expect(s.get('c')).toBe(333)
  })
  test('even split leaves no remainder', () => {
    const s = shares(900, ['a', 'b', 'c'])
    expect([...s.values()]).toEqual([300, 300, 300])
  })
  test('no participants yields empty map', () => {
    expect(shares(1000, []).size).toBe(0)
  })
})

const fixtureExpenses: Expense[] = [
  // Alice pays 30.00 for all three
  expense('e1', 'alice', 30, ['alice', 'bob', 'marie']),
  // Bob pays 12.00 for himself and marie
  expense('e2', 'bob', 12, ['bob', 'marie']),
]

describe('balances', () => {
  test('balances sum to zero', () => {
    const b = balances(fixtureExpenses, [])
    expect([...b.values()].reduce((x, y) => x + y, 0)).toBe(0)
  })
  test('paid minus owed', () => {
    const b = balances(fixtureExpenses, [])
    // alice: paid 3000, owes 1000 -> +2000
    expect(b.get('alice')).toBe(2000)
    // bob: paid 1200, owes 1000 + 600 = 1600 -> -400
    expect(b.get('bob')).toBe(-400)
    // marie: paid 0, owes 1000 + 600 = 1600 -> -1600
    expect(b.get('marie')).toBe(-1600)
  })
  test('payment reduces debt', () => {
    // marie owes 12.00 to bob, then pays 12.00
    const exp = [expense('e', 'bob', 12, ['marie'])]
    const before = balances(exp, [])
    expect(before.get('marie')).toBe(-1200)
    expect(before.get('bob')).toBe(1200)
    const after = balances(exp, [payment('p', 'marie', 'bob', 12)])
    expect(after.get('marie')).toBe(0)
    expect(after.get('bob')).toBe(0)
  })
  test('non-participant payer ends positive', () => {
    // Alice pays 20.00 for bob and marie only; she owes nothing
    const exp = [expense('e', 'alice', 20, ['bob', 'marie'])]
    const b = balances(exp, [])
    expect(b.get('alice')).toBe(2000)
    expect(b.get('bob')).toBe(-1000)
    expect(b.get('marie')).toBe(-1000)
  })
  test('custom_shares override equal split', () => {
    const exp = [expense('e', 'alice', 30, ['alice', 'bob', 'marie'], {
      alice: 10, bob: 15, marie: 5,
    })]
    const b = balances(exp, [])
    // alice: paid 3000, owes 1000 -> +2000
    expect(b.get('alice')).toBe(2000)
    // bob: paid 0, owes 1500 -> -1500
    expect(b.get('bob')).toBe(-1500)
    // marie: paid 0, owes 500 -> -500
    expect(b.get('marie')).toBe(-500)
  })
  test('custom_shares balances sum to zero', () => {
    const exp = [expense('e', 'bob', 50, ['alice', 'bob'], {
      alice: 20, bob: 30,
    })]
    const b = balances(exp, [])
    expect([...b.values()].reduce((x, y) => x + y, 0)).toBe(0)
  })
})

describe('suggestTransfers', () => {
  test('transfers settle everyone', () => {
    const b = balances(fixtureExpenses, [])
    const t = suggestTransfers(b)
    for (const { from, to, amount } of t) {
      bump(b, from, amount)
      bump(b, to, -amount)
    }
    for (const v of b.values()) expect(v).toBe(0)
  })
  test('at most n-1 transfers', () => {
    const b = balances(fixtureExpenses, [])
    const n = b.size
    const t = suggestTransfers(b)
    expect(t.length).toBeLessThanOrEqual(n - 1)
  })
  test('empty balances yield no transfers', () => {
    expect(suggestTransfers(new Map())).toEqual([])
  })
})
