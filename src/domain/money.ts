import type { Expense, Payment, Person } from './types.ts'
import { stayOverlapDays } from './presence.ts'

export type Transfer = { from: string; to: string; amount: number }

// Weighted split in integer cents, largest-remainder method: parts always sum
// exactly to totalCents. With equal weights the remainder cents land on the
// first participants (stable sort), i.e. plain even split.
export function weightedShares(totalCents: number, weights: Map<string, number>): Map<string, number> {
  const out = new Map<string, number>()
  const totalW = [...weights.values()].reduce((a, b) => a + b, 0)
  if (totalW <= 0) return out
  const fracs: { id: string; frac: number }[] = []
  let assigned = 0
  for (const [id, w] of weights) {
    const raw = (totalCents * w) / totalW
    const base = Math.floor(raw)
    out.set(id, base)
    assigned += base
    fracs.push({ id, frac: raw - base })
  }
  fracs.sort((a, z) => z.frac - a.frac)
  for (let k = 0; k < totalCents - assigned; k++) {
    const { id } = fracs[k]
    out.set(id, (out.get(id) ?? 0) + 1)
  }
  return out
}

// Even split in integer cents.
export function shares(totalCents: number, participantIds: string[]): Map<string, number> {
  return weightedShares(totalCents, new Map(participantIds.map((id) => [id, 1])))
}

// Days each participant is on the hook for over [date, end]. Ticked people
// with zero overlap (or whose person row is gone) still count one day rather
// than riding free; people without stay dates count as there the whole time.
function participantDays(e: Expense, end: string, people: Person[]): Map<string, number> {
  const byId = new Map(people.map((p) => [p.id, p]))
  const days = new Map<string, number>()
  for (const id of e.participant_ids ?? []) {
    const p = byId.get(id)
    days.set(id, p ? Math.max(stayOverlapDays(p, e.date, end), 1) : 1)
  }
  return days
}

// Cents owed per participant of one expense. Three shapes:
// - per_head: amount is a €/person/day rate; each participant owes
//   rate × their days in the covered range (a single-date expense is 1 day).
// - date-range (end_date after date): splits amount by days present in the
//   range — someone there 2 of 7 days pays 2/7 of a full-stayer's share.
// - plain: even split of amount.
// Fields are guarded (?? fallbacks) because a partially synced row can surface
// with them briefly undefined; a NaN here would poison every balance.
export function expenseShares(e: Expense, people: Person[]): Map<string, number> {
  const cents = Math.round((e.amount ?? 0) * 100)
  const end = e.end_date && e.end_date > e.date ? e.end_date : null
  if (e.per_head) {
    const out = new Map<string, number>()
    const days = end ? participantDays(e, end, people) : null
    for (const id of e.participant_ids ?? []) out.set(id, cents * (days?.get(id) ?? 1))
    return out
  }
  if (!end) return shares(cents, e.participant_ids ?? [])
  return weightedShares(cents, participantDays(e, end, people))
}

// What the payer actually laid out, in cents: the amount for a normal expense,
// the sum of everyone's contributions for a per_head one.
export function expenseTotal(e: Expense, people: Person[]): number {
  if (!e.per_head) return Math.round((e.amount ?? 0) * 100)
  let total = 0
  for (const v of expenseShares(e, people).values()) total += v
  return total
}

// Net position per person in cents: what they paid minus what they owe, then
// adjusted by settled payments. Always sums to zero. `people` feeds the
// by-days split; without it every expense falls back to an even split.
export function balances(expenses: Expense[], payments: Payment[], people: Person[] = []): Map<string, number> {
  const b = new Map<string, number>()
  const bump = (id: string, cents: number) => b.set(id, (b.get(id) ?? 0) + cents)
  for (const e of expenses) {
    bump(e.payer_id, expenseTotal(e, people))
    for (const [id, owed] of expenseShares(e, people)) bump(id, -owed)
  }
  for (const p of payments) {
    const cents = Math.round(p.amount * 100)
    bump(p.from_id, cents)
    bump(p.to_id, -cents)
  }
  return b
}

export function suggestTransfers(b: Map<string, number>): Transfer[] {
  const owers = [...b].filter(([, v]) => v < 0).map(([id, v]) => ({ id, v })).sort((a, z) => a.v - z.v)
  const owed = [...b].filter(([, v]) => v > 0).map(([id, v]) => ({ id, v })).sort((a, z) => z.v - a.v)
  const out: Transfer[] = []
  let i = 0, j = 0
  while (i < owers.length && j < owed.length) {
    const x = Math.min(-owers[i].v, owed[j].v)
    if (x > 0) out.push({ from: owers[i].id, to: owed[j].id, amount: x })
    owers[i].v += x; owed[j].v -= x
    if (owers[i].v === 0) i++
    if (owed[j].v === 0) j++
  }
  return out
}
// ponytail: greedy, not provably minimal; everyone ends square, <= n-1 transfers
