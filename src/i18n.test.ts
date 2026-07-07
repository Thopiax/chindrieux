import { describe, expect, test } from 'vitest'
import { dict, interpolate, LANGS, pickLang, translate } from './i18n.ts'

describe('dict', () => {
  test('every key has all four languages, non-empty', () => {
    for (const [key, entry] of Object.entries(dict))
      for (const l of LANGS)
        expect(entry[l], `${key}.${l}`).toBeTruthy()
  })
})

describe('interpolate', () => {
  test('substitutes a single {n}', () => {
    expect(interpolate('You owe {n}', { n: 12 })).toBe('You owe 12')
  })
  test('substitutes multiple and repeated placeholders', () => {
    expect(interpolate('{a} and {b} and {a}', { a: 'x', b: 'y' })).toBe('x and y and x')
  })
  test('leaves unknown placeholders intact', () => {
    expect(interpolate('hi {name}', {})).toBe('hi {name}')
  })
  test('returns the string unchanged when no vars given', () => {
    expect(interpolate('plain', undefined)).toBe('plain')
  })
})

describe('translate', () => {
  test('returns the string for a known key and language', () => {
    expect(translate('en', 'common.save')).toBe(dict['common.save'].en)
    expect(translate('pt', 'common.save')).toBe(dict['common.save'].pt)
  })
  test('returns the key itself for a missing key', () => {
    expect(translate('en', 'nope.missing')).toBe('nope.missing')
  })
  test('flows vars through interpolation without breaking a plain string', () => {
    expect(translate('en', 'common.save', { n: 1 })).toBe(dict['common.save'].en)
  })
})

describe('pickLang', () => {
  test('maps exact two-letter prefixes', () => {
    expect(pickLang('en-US')).toBe('en')
    expect(pickLang('fr')).toBe('fr')
    expect(pickLang('nl-BE')).toBe('nl')
  })
  test('pt and pt-BR both map to pt', () => {
    expect(pickLang('pt')).toBe('pt')
    expect(pickLang('pt-BR')).toBe('pt')
  })
  test('falls back to en for unknown, empty, or missing', () => {
    expect(pickLang('de')).toBe('en')
    expect(pickLang('')).toBe('en')
    expect(pickLang(undefined)).toBe('en')
  })
})
