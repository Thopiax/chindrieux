import { useState } from 'react'
import { LangSwitcher } from '../components/LangSwitcher.tsx'
import { StayCalendar } from '../components/StayCalendar.tsx'
import { Badge } from '../components/Badge.tsx'
import { Card } from '../components/Card.tsx'
import { COLORS, EMOJIS } from '../avatars.ts'
import { useT } from '../i18n.ts'
import { handleRadioKeydown, radioTabIndex } from '../a11y.ts'
import { myId$ } from '../identity.ts'
import { go } from '../nav.ts'
import { people$, useRows } from '../store.ts'
import type { Person } from '../domain/types.ts'

type Step = 1 | 2 | 3

type Form = {
  name: string
  emoji: string | null
  color: string | null
  arrival: string
  departure: string
  blaze: boolean
  drink: boolean
  hasCar: boolean
  meat: boolean
  team: string
  mode: number
}

const emptyForm: Form = {
  name: '',
  emoji: null,
  color: null,
  arrival: '',
  departure: '',
  blaze: false,
  drink: false,
  hasCar: false,
  // Opposite default from the other toggles: most people eat meat, vegetarians untick.
  meat: true,
  team: '',
  mode: 50,
}

// Hydrate the editable form from a saved person (shared by edit mode and the
// existing-person picker).
const formFromPerson = (p: Person): Form => ({
  name: p.name,
  emoji: p.avatar_emoji,
  color: p.avatar_color,
  arrival: p.arrival ?? '',
  departure: p.departure ?? '',
  blaze: p.blaze ?? false,
  drink: p.drink ?? false,
  hasCar: p.has_car ?? false,
  meat: p.eats_meat ?? true,
  team: p.world_cup_team ?? '',
  mode: p.mode ?? 50,
})

// first-run: fresh guest picking themselves (sets myId$).
// edit: reopen my saved profile prefilled (keeps myId$).
// edit-other: edit any other person's saved profile (never touches myId$).
// add: create someone else without claiming them (never sets myId$).
export type OnboardingMode = 'first-run' | 'edit' | 'edit-other' | 'add'

const primaryBtn = {
  fontFamily: 'inherit',
  fontWeight: 700,
  fontSize: 17,
  color: '#fff',
  background: 'var(--color-cerulean)',
  border: 'none',
  borderRadius: 9999,
  padding: '14px 24px',
  minHeight: 48,
  cursor: 'pointer',
} as const

// Bottom action row: back on the left, primary action filling the thumb zone.
function StepActions({
  backLabel,
  onBack,
  nextLabel,
  onNext,
  nextDisabled = false,
}: {
  backLabel: string
  onBack: () => void
  nextLabel: string
  onNext: () => void
  nextDisabled?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 28 }}>
      <button type="button" onClick={onBack} className="back-chip">
        {'← '}
        {backLabel}
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        style={{ ...primaryBtn, flex: 1, opacity: nextDisabled ? 0.4 : 1 }}
      >
        {nextLabel}
      </button>
    </div>
  )
}

export function Onboarding({
  mode = 'first-run',
  personId,
  onDone,
}: {
  mode?: OnboardingMode
  // Which person to edit in 'edit-other' mode; defaults to myId$ for 'edit'.
  personId?: string
  onDone?: () => void
} = {}) {
  const t = useT()
  const people = useRows(people$)
  // Both edit variants open straight on the badge step, prefilled from a saved
  // row: my own for 'edit', an arbitrary person for 'edit-other'.
  const editing = mode === 'edit' || mode === 'edit-other'
  const editId = mode === 'edit-other' ? (personId ?? null) : (myId$.peek() ?? null)
  const [step, setStep] = useState<Step>(() => (editing ? 2 : 1))
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    editing ? editId : null,
  )
  const [form, setForm] = useState<Form>(() => {
    if (editing && editId) {
      const row = people$[editId].peek() as Person | undefined
      if (row) return formFromPerson(row)
    }
    return emptyForm
  })

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const finish = () => (onDone ? onDone() : go(''))

  const pickExisting = (p: Person) => {
    setSelectedId(p.id)
    setForm(formFromPerson(p))
    setStep(2)
  }

  const startNew = () => {
    setSelectedId(null)
    setStep(2)
  }

  const save = () => {
    const id = selectedId ?? crypto.randomUUID()
    const fields = {
      name: form.name.trim(),
      avatar_emoji: form.emoji,
      avatar_color: form.color,
      arrival: form.arrival || null,
      departure: form.departure || null,
      blaze: form.blaze,
      drink: form.drink,
      has_car: form.hasCar,
      eats_meat: form.meat,
      world_cup_team: form.team.trim() || null,
      mode: form.mode,
    }
    if (selectedId) {
      people$[id].assign(fields)
    } else {
      const row: Person = { id, iban: null, ...fields }
      people$[id].set(row)
    }
    // Only first-run and editing my own profile claim the row as me; adding or
    // editing someone else never touches myId$.
    if (mode === 'first-run' || mode === 'edit') myId$.set(id)
    finish()
  }

  const title =
    mode === 'edit'
      ? t('profiles.editMyProfile')
      : mode === 'edit-other'
        ? t('profiles.editProfile')
        : mode === 'add'
          ? t('profiles.addTitle')
          : t('onboarding.title')

  return (
    <section>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="marker-underline">{title}</h1>
        {mode === 'first-run' ? (
          <LangSwitcher />
        ) : (
          <button type="button" onClick={finish} className="back-chip">
            {t('common.close')}
          </button>
        )}
      </div>

      {step === 1 && (
        <StepWho
          t={t}
          mode={mode}
          people={people}
          name={form.name}
          onName={(v) => set('name', v)}
          onPick={pickExisting}
          onNew={startNew}
        />
      )}

      {step === 2 && (
        <StepBadge
          t={t}
          form={form}
          onEmoji={(v) => set('emoji', v)}
          onColor={(v) => set('color', v)}
          onBack={editing ? finish : () => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <StepVibes
          t={t}
          form={form}
          set={set}
          onBack={() => setStep(2)}
          onSave={save}
        />
      )}
    </section>
  )
}

type T = ReturnType<typeof useT>

function StepWho({
  t,
  mode,
  people,
  name,
  onName,
  onPick,
  onNew,
}: {
  t: T
  mode: OnboardingMode
  people: Person[]
  name: string
  onName: (v: string) => void
  onPick: (p: Person) => void
  onNew: () => void
}) {
  // Adding someone else is always a new person: skip the "that's me" picker and
  // ask only for their name.
  const adding = mode === 'add'
  return (
    <div>
      {!adding && <h2>{t('onboarding.whoAreYou')}</h2>}
      {!adding && people.length > 0 && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
            gap: 12,
            marginBottom: 20,
          }}
        >
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                opacity: 0.6,
                padding: 8,
              }}
            >
              <Badge person={p} size="md" />
              <span style={{ fontWeight: 700 }}>{p.name}</span>
              <span style={{ fontSize: 12 }}>{t('onboarding.thatsMe')}</span>
            </button>
          ))}
        </div>
      )}
      {!adding && people.length > 0 && (
        <p style={{ fontSize: 13, fontWeight: 700, opacity: 0.65, margin: '-8px 0 20px' }}>
          {t('onboarding.claimHint')}
        </p>
      )}

      <Card>
        <label htmlFor="name" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>
          {adding ? t('profiles.theirName') : t('onboarding.imNew')}
        </label>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => onName(e.target.value)}
            placeholder={adding ? undefined : t('onboarding.namePlaceholder')}
            style={{
              flex: 1,
              minWidth: 160,
              fontFamily: 'inherit',
              fontSize: 16,
              padding: '10px 12px',
              borderRadius: 8,
              border: '2px solid var(--color-ink)',
            }}
          />
          <button
            type="button"
            onClick={onNew}
            disabled={name.trim() === ''}
            style={{ ...primaryBtn, opacity: name.trim() === '' ? 0.4 : 1 }}
          >
            {t('onboarding.next')}
          </button>
        </div>
      </Card>
    </div>
  )
}

function StepBadge({
  t,
  form,
  onEmoji,
  onColor,
  onBack,
  onNext,
}: {
  t: T
  form: Form
  onEmoji: (v: string | null) => void
  onColor: (v: string) => void
  onBack: () => void
  onNext: () => void
}) {
  return (
    <div>
      <h2>{t('onboarding.buildYourBadge')}</h2>

      <div style={{ display: 'grid', placeItems: 'center', margin: '12px 0 20px' }}>
        <Badge
          person={{ name: form.name, avatar_emoji: form.emoji, avatar_color: form.color }}
          size="lg"
        />
      </div>

      <p style={{ fontWeight: 700, marginBottom: 8 }}>{t('onboarding.pickEmoji')}</p>
      <div
        role="radiogroup"
        aria-label={t('onboarding.pickEmoji')}
        onKeyDown={(ev) => handleRadioKeydown(ev, EMOJIS, form.emoji, onEmoji)}
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(44px, 1fr))',
          gap: 6,
          marginBottom: 20,
        }}
      >
        {EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            role="radio"
            aria-checked={form.emoji === e}
            tabIndex={radioTabIndex(e, form.emoji, EMOJIS)}
            onClick={() => onEmoji(e)}
            style={{
              fontSize: 24,
              lineHeight: 1,
              minHeight: 44,
              padding: 6,
              borderRadius: 8,
              cursor: 'pointer',
              background: form.emoji === e ? 'var(--color-sunny)' : '#fff',
              border: '2px solid var(--color-ink)',
            }}
          >
            {e}
          </button>
        ))}
      </div>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, marginBottom: 24 }}>
        {t('onboarding.customEmoji')}
        <input
          type="text"
          inputMode="text"
          value={EMOJIS.includes(form.emoji ?? '') ? '' : (form.emoji ?? '')}
          onChange={(ev) => {
            // Keep only the last grapheme so pasting/typing several emoji works.
            // An empty field clears the emoji to null so Badge's initial-letter
            // fallback kicks in (an empty string would defeat its ?? fallback).
            const raw = ev.target.value.trim()
            let last = ''
            for (const g of new Intl.Segmenter().segment(raw)) last = g.segment
            onEmoji(last || null)
          }}
          placeholder="🫠"
          style={{
            width: 72, fontSize: 24, textAlign: 'center', padding: '8px 4px',
            borderRadius: 8, border: '2px solid var(--color-ink)', fontFamily: 'inherit',
          }}
        />
      </label>

      <p style={{ fontWeight: 700, marginBottom: 8 }}>{t('onboarding.pickColor')}</p>
      <div
        role="radiogroup"
        aria-label={t('onboarding.pickColor')}
        onKeyDown={(ev) => handleRadioKeydown(ev, COLORS, form.color, onColor)}
        style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}
      >
        {COLORS.map((c) => (
          <button
            key={c}
            type="button"
            role="radio"
            aria-checked={form.color === c}
            aria-label={c}
            tabIndex={radioTabIndex(c, form.color, COLORS)}
            onClick={() => onColor(c)}
            style={{
              width: 44,
              height: 44,
              borderRadius: 9999,
              cursor: 'pointer',
              background: c,
              border: form.color === c ? '3px solid var(--color-ink)' : '3px solid #fff',
              boxShadow: '0 0 0 1px rgb(0 0 0 / .2)',
            }}
          />
        ))}
      </div>

      <StepActions
        backLabel={t('common.back')}
        onBack={onBack}
        nextLabel={t('onboarding.next')}
        onNext={onNext}
      />
    </div>
  )
}

function StepVibes({
  t,
  form,
  set,
  onBack,
  onSave,
}: {
  t: T
  form: Form
  set: <K extends keyof Form>(key: K, value: Form[K]) => void
  onBack: () => void
  onSave: () => void
}) {
  const toggles: { key: 'blaze' | 'drink' | 'hasCar' | 'meat'; label: string }[] = [
    { key: 'blaze', label: `🌿 ${t('onboarding.vibes.blaze')}` },
    { key: 'drink', label: `🍷 ${t('onboarding.vibes.drink')}` },
    { key: 'meat', label: `🥩 ${t('onboarding.vibes.meat')}` },
    { key: 'hasCar', label: `🚗 ${t('onboarding.vibes.hasCar')}` },
  ]
  const dateInput = {
    fontFamily: 'inherit', fontSize: 16, padding: '12px 10px', borderRadius: 8,
    border: '2px solid var(--color-ink)', width: '100%', boxSizing: 'border-box',
  } as const
  return (
    <div>
      <h2>{t('onboarding.datesAndVibes')}</h2>

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontWeight: 700, marginBottom: 8 }}>{t('onboarding.stayDates')}</p>
        <StayCalendar
          arrival={form.arrival}
          departure={form.departure}
          onChange={(arrival, departure) => {
            set('arrival', arrival)
            set('departure', departure)
          }}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {toggles.map((tg) => (
          <label
            key={tg.key}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, fontWeight: 700,
              padding: '12px 14px', borderRadius: 12, cursor: 'pointer',
              border: '2px solid var(--color-ink)',
              background: form[tg.key] ? 'var(--color-sunny)' : '#fff',
            }}
          >
            <input
              type="checkbox"
              checked={form[tg.key]}
              onChange={(e) => set(tg.key, e.target.checked)}
              style={{ width: 24, height: 24, flexShrink: 0 }}
            />
            {tg.label}
          </label>
        ))}
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontWeight: 700, marginBottom: 24 }}>
        {t('onboarding.vibes.worldCupTeam')}
        <input
          type="text"
          value={form.team}
          onChange={(e) => set('team', e.target.value)}
          placeholder={t('onboarding.vibes.teamPlaceholder')}
          style={{ ...dateInput, padding: '12px' }}
        />
      </label>

      <div>
        <p style={{ fontWeight: 700, marginBottom: 8 }}>{t('onboarding.vibes.workChill')}</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span>{t('onboarding.work')}</span>
          <input
            type="range"
            min={0}
            max={100}
            value={form.mode}
            onChange={(e) => set('mode', Number(e.target.value))}
            aria-label={t('onboarding.vibes.workChill')}
            style={{ flex: 1, minHeight: 32 }}
          />
          <span>{t('onboarding.chill')}</span>
        </div>
      </div>

      <StepActions
        backLabel={t('common.back')}
        onBack={onBack}
        nextLabel={t('common.save')}
        onNext={onSave}
      />
    </div>
  )
}
