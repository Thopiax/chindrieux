import type { Expense, Payment } from './types.ts'

export type Transfer = { from: string; to: string; amount: number }

// Even split in integer cents; the remainder cents land on the first participants,
// so the parts always sum exactly to totalCents.
export function shares(totalCents: number, participantIds: string[]): Map<string, number> {
  const out = new Map<string, number>()
  const n = participantIds.length
  if (n === 0) return out
  const base = Math.floor(totalCents / n)
  let remainder = totalCents - base * n
  for (const id of participantIds) {
    out.set(id, base + (remainder > 0 ? 1 : 0))
    if (remainder > 0) remainder -= 1
  }
  return out
}

// Net position per person in cents: what they paid minus what they owe, then
// adjusted by settled payments. Always sums to zero.
// When an expense has custom_shares (euros per person), those are used instead
// of an equal split.
export function balances(expenses: Expense[], payments: Payment[]): Map<string, number> {
  const b = new Map<string, number>()
  const bump = (id: string, cents: number) => b.set(id, (b.get(id) ?? 0) + cents)
  for (const e of expenses) {
    const totalCents = Math.round(e.amount * 100)
    bump(e.payer_id, totalCents)
    if (e.custom_shares) {
      for (const [id, euros] of Object.entries(e.custom_shares)) {
        bump(id, -Math.round(euros * 100))
      }
    } else {
      for (const [id, owed] of shares(totalCents, e.participant_ids)) bump(id, -owed)
    }
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
