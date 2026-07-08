import { describe, expect, it } from 'vitest'
import { addMonth, eachDay, monthGrid, nextStay } from './stay.ts'

describe('nextStay', () => {
  it('first tap sets arrival', () => {
    expect(nextStay({ arrival: null, departure: null }, '2026-07-08'))
      .toEqual({ arrival: '2026-07-08', departure: null })
  })

  it('second tap after arrival sets departure', () => {
    expect(nextStay({ arrival: '2026-07-08', departure: null }, '2026-07-12'))
      .toEqual({ arrival: '2026-07-08', departure: '2026-07-12' })
  })

  it('same-day second tap makes a one-day stay', () => {
    expect(nextStay({ arrival: '2026-07-08', departure: null }, '2026-07-08'))
      .toEqual({ arrival: '2026-07-08', departure: '2026-07-08' })
  })

  it('tap before arrival restarts the selection', () => {
    expect(nextStay({ arrival: '2026-07-08', departure: null }, '2026-07-05'))
      .toEqual({ arrival: '2026-07-05', departure: null })
  })

  it('tap with a complete range restarts the selection', () => {
    expect(nextStay({ arrival: '2026-07-08', departure: '2026-07-12' }, '2026-07-20'))
      .toEqual({ arrival: '2026-07-20', departure: null })
  })
})

describe('monthGrid', () => {
  it('pads Monday-first and covers the whole month', () => {
    const grid = monthGrid('2026-07') // 1 Jul 2026 is a Wednesday: 2 leading nulls
    expect(grid.slice(0, 3)).toEqual([null, null, '2026-07-01'])
    expect(grid.filter(Boolean)).toHaveLength(31)
    expect(grid.at(-1)).toBe('2026-07-31')
  })
})

describe('addMonth', () => {
  it('steps forward and back across year boundaries', () => {
    expect(addMonth('2026-12', 1)).toBe('2027-01')
    expect(addMonth('2026-01', -1)).toBe('2025-12')
  })
})

describe('eachDay', () => {
  it('is inclusive and empty on degenerate ranges', () => {
    expect(eachDay('2026-07-30', '2026-08-01'))
      .toEqual(['2026-07-30', '2026-07-31', '2026-08-01'])
    expect(eachDay('2026-07-02', '2026-07-01')).toEqual([])
  })
})
