import { describe, expect, test } from 'vitest'
import type { Expense, Payment, Person } from './types.ts'
import { balances, expenseShares, expenseTotal, shares, suggestTransfers, weightedShares } from './money.ts'

function expense(
  id: string, payer_id: string, amount: number, participant_ids: string[],
): Expense {
  return {
    id, payer_id, amount, label: id, date: '2026-07-10',
    participant_ids, photo_url: null,
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

function person(id: string, arrival: string | null, departure: string | null): Person {
  return {
    id, name: id, avatar_emoji: null, avatar_color: null, iban: null,
    arrival, departure, blaze: null, drink: null, has_car: null,
    world_cup_team: null, mode: null,
  }
}

describe('weightedShares', () => {
  test('splits proportionally and sums exactly', () => {
    const s = weightedShares(9000, new Map([['a', 7], ['b', 2]]))
    expect(s.get('a')).toBe(7000)
    expect(s.get('b')).toBe(2000)
  })
  test('rounding remainder still sums exactly to total', () => {
    const s = weightedShares(7000, new Map([['a', 7], ['b', 2]]))
    expect([...s.values()].reduce((x, y) => x + y)).toBe(7000)
  })
  test('zero total weight yields empty map', () => {
    expect(weightedShares(1000, new Map()).size).toBe(0)
  })
})

describe('expenseShares', () => {
  const week = { date: '2026-07-10', end_date: '2026-07-16' } // 7 days
  const rangedExpense = (participant_ids: string[]): Expense => ({
    id: 'car', payer_id: 'a', amount: 90, label: 'car', participant_ids,
    photo_url: null, ...week,
  })

  test('by-days: full week vs two days', () => {
    const people = [
      person('a', '2026-07-10', '2026-07-16'), // 7 days
      person('b', '2026-07-15', '2026-07-20'), // 2 days in range
    ]
    const s = expenseShares(rangedExpense(['a', 'b']), people)
    expect(s.get('a')).toBe(7000)
    expect(s.get('b')).toBe(2000)
  })
  test('no end_date falls back to even split', () => {
    const e = { ...rangedExpense(['a', 'b']), end_date: null }
    const s = expenseShares(e, [person('a', '2026-07-10', '2026-07-16'), person('b', '2026-07-15', '2026-07-16')])
    expect(s.get('a')).toBe(4500)
    expect(s.get('b')).toBe(4500)
  })
  test('ticked but zero overlap pays a one-day share', () => {
    const people = [
      person('a', '2026-07-10', '2026-07-16'), // 7 days
      person('b', '2026-07-01', '2026-07-02'), // gone before it starts
    ]
    const s = expenseShares({ ...rangedExpense(['a', 'b']), amount: 80 }, people)
    expect(s.get('a')).toBe(7000)
    expect(s.get('b')).toBe(1000)
  })
  test('no stay dates counts as there the whole time', () => {
    const people = [person('a', '2026-07-10', '2026-07-16'), person('b', null, null)]
    const s = expenseShares({ ...rangedExpense(['a', 'b']), amount: 140 }, people)
    expect(s.get('a')).toBe(7000)
    expect(s.get('b')).toBe(7000)
  })
  test('balances stay zero-sum with ranged expenses', () => {
    const people = [person('a', '2026-07-10', '2026-07-16'), person('b', '2026-07-15', '2026-07-20')]
    const b = balances([rangedExpense(['a', 'b'])], [], people)
    expect([...b.values()].reduce((x, y) => x + y, 0)).toBe(0)
    expect(b.get('a')).toBe(2000) // paid 9000, owes 7000
    expect(b.get('b')).toBe(-2000)
  })
})

describe('per_head expenses', () => {
  const week = { date: '2026-07-10', end_date: '2026-07-16' } // 7 days
  // €5 per person per day car chip-in, collected by 'a'
  const chipIn = (participant_ids: string[]): Expense => ({
    id: 'car', payer_id: 'a', amount: 5, label: 'car', participant_ids,
    photo_url: null, per_head: true, ...week,
  })

  test('each participant owes rate × their days', () => {
    const people = [
      person('b', '2026-07-10', '2026-07-16'), // 7 days
      person('c', '2026-07-15', '2026-07-20'), // 2 days in range
    ]
    const s = expenseShares(chipIn(['b', 'c']), people)
    expect(s.get('b')).toBe(3500)
    expect(s.get('c')).toBe(1000)
  })
  test('total is the sum of contributions, and balances stay zero-sum', () => {
    const people = [
      person('a', '2026-07-10', '2026-07-16'),
      person('b', '2026-07-10', '2026-07-16'),
      person('c', '2026-07-15', '2026-07-20'),
    ]
    const e = chipIn(['b', 'c'])
    expect(expenseTotal(e, people)).toBe(4500)
    const b = balances([e], [], people)
    expect([...b.values()].reduce((x, y) => x + y, 0)).toBe(0)
    expect(b.get('a')).toBe(4500) // collects, contributes nothing
  })
  test('single-date per_head charges one day each', () => {
    const e = { ...chipIn(['b', 'c']), end_date: null }
    const s = expenseShares(e, [])
    expect(s.get('b')).toBe(500)
    expect(s.get('c')).toBe(500)
  })
  test('ticked but zero overlap still owes one day', () => {
    const people = [person('b', '2026-07-01', '2026-07-02')] // gone before it starts
    expect(expenseShares(chipIn(['b']), people).get('b')).toBe(500)
  })
  test('expenseTotal of a normal expense is just the amount', () => {
    expect(expenseTotal(expense('e', 'a', 12.34, ['a', 'b']), [])).toBe(1234)
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
