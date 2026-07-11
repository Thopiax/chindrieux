import { useState, type CSSProperties } from 'react'
import { use$ } from '@legendapp/state/react'
import { Badge } from '../components/Badge.tsx'
import { Card } from '../components/Card.tsx'
import { Screen } from '../components/Screen.tsx'
import { PersonPicker } from '../components/PersonPicker.tsx'
import { useT } from '../i18n.ts'
import { myId$ } from '../identity.ts'
import { expenses$, payments$, people$, useRows } from '../store.ts'
import { balances, shares, suggestTransfers } from '../domain/money.ts'
import type { Expense, Payment, Person } from '../domain/types.ts'
import { uploadPhoto } from '../photos.ts'
import { routeQuery } from '../nav.ts'
import { todayISO } from '../today.ts'

type T = ReturnType<typeof useT>

// Always two decimals with the euro sign; caller supplies euros.
// Guarded so a partially-synced row (amount briefly undefined) renders €0.00 instead of crashing.
function fmtEur(euros: number): string {
  return `€${(Number.isFinite(euros) ? euros : 0).toFixed(2)}`
}
// Transfers carry integer cents; render them as euros.
function fmtCents(cents: number): string {
  return fmtEur(cents / 100)
}

const mono: CSSProperties = { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }

const primaryBtn: CSSProperties = {
  fontFamily: 'inherit', fontWeight: 700, fontSize: 15, color: '#fff',
  background: 'var(--color-cerulean)', border: 'none', borderRadius: 9999,
  padding: '9px 18px', cursor: 'pointer',
}
const ghostBtn: CSSProperties = {
  fontFamily: 'inherit', fontWeight: 700, fontSize: 14, color: 'var(--color-ink)',
  background: 'none', border: 'none', cursor: 'pointer', padding: '10px 12px', minHeight: 44,
}
const inputStyle: CSSProperties = {
  fontFamily: 'inherit', fontSize: 16, padding: '10px 12px', borderRadius: 8,
  border: '2px solid var(--color-ink)', width: '100%', boxSizing: 'border-box',
}
const fieldLabel: CSSProperties = { display: 'block', fontWeight: 700, marginBottom: 6 }

// Parse a euro amount the guest typed. Accepts a comma or a dot as the decimal
// separator (a euro app has plenty of comma-locale users) and rounds to whole
// cents. Returns NaN for anything that isn't a number so callers can gate save.
function parseAmount(raw: string): number {
  if (raw.trim() === '') return NaN
  const n = Number(raw.replace(',', '.'))
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN
}

// Which people are ticked: nobody by default, then whatever the guest checked.
// We deliberately do not pre-select present-on-date people (too easy to miss an
// unwanted tick); the guest picks the split explicitly.
function checkedFor(people: Person[], overrides: Record<string, boolean>): Set<string> {
  const out = new Set<string>()
  for (const p of people) if (overrides[p.id]) out.add(p.id)
  return out
}

// Seed the override map for an edited expense from its saved participants.
function overridesFromExpense(e: Expense): Record<string, boolean> {
  const out: Record<string, boolean> = {}
  for (const id of e.participant_ids) out[id] = true
  return out
}

export function Costs() {
  const t = useT()
  const myId = use$(myId$) as string
  const people = useRows(people$)
  const expenses = useRows(expenses$)
  const payments = useRows(payments$)

  // Closed, adding, or editing a specific expense. The form remounts fresh each
  // time it opens (keyed below) so its pre-check starts from presence again.
  // Arriving via '#/costs?new' (the home screen's one-tap) opens the add form.
  const [form, setForm] = useState<{ mode: 'add' } | { mode: 'edit'; expense: Expense } | null>(
    () => (routeQuery().has('new') ? { mode: 'add' } : null),
  )
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  // Drop the '?new' marker once the form closes so a reload stays closed.
  const closeForm = () => {
    setForm(null)
    if (routeQuery().has('new')) history.replaceState(null, '', '#/costs')
  }

  const byId = new Map(people.map((p) => [p.id, p]))
  const nameOf = (id: string) => byId.get(id)?.name ?? '?'

  if (form) {
    return (
      <Screen title={t('costs.title')}>
        <ExpenseForm
          key={form.mode === 'edit' ? form.expense.id : 'new'}
          t={t}
          people={people}
          myId={myId}
          initial={form.mode === 'edit' ? form.expense : null}
          onClose={closeForm}
        />
      </Screen>
    )
  }

  return (
    <Screen title={t('costs.title')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {expenses.length === 0 ? (
          <p>{t('costs.empty')}</p>
        ) : (
          expenses.map((e) => (
            <Card key={e.id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 18, display: 'block', marginBottom: 8 }}>{e.label}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Badge person={byId.get(e.payer_id) ?? fallbackPerson(nameOf(e.payer_id))} size="sm" />
                    <span style={{ ...mono, fontWeight: 700, fontSize: 18 }}>{fmtEur(e.amount)}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {e.participant_ids.map((id) => (
                      <Badge key={id} person={byId.get(id) ?? fallbackPerson(nameOf(id))} size="sm" />
                    ))}
                  </div>
                </div>
                {e.photo_url && (
                  <img
                    src={e.photo_url}
                    alt={e.label}
                    style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--color-ink)' }}
                  />
                )}
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" style={ghostBtn} onClick={() => setForm({ mode: 'edit', expense: e })}>
                  {t('common.edit')}
                </button>
                <button
                  type="button"
                  style={{ ...ghostBtn, color: 'var(--color-tomato-text)' }}
                  onClick={() => {
                    if (pendingDelete === e.id) {
                      expenses$[e.id].deleted.set(true)
                      setPendingDelete(null)
                    } else {
                      setPendingDelete(e.id)
                    }
                  }}
                >
                  {pendingDelete === e.id ? t('costs.tapAgain') : t('common.delete')}
                </button>
              </div>
            </Card>
          ))
        )}
      </div>

      <button type="button" style={{ ...primaryBtn, marginBottom: 28 }} onClick={() => setForm({ mode: 'add' })}>
        {t('costs.addExpense')}
      </button>

      <SettleUp t={t} myId={myId} byId={byId} nameOf={nameOf} expenses={expenses} payments={payments} />
    </Screen>
  )
}

// Minimal stand-in badge for an id whose person row is gone (e.g. deleted).
function fallbackPerson(name: string): Person {
  return { id: '', name, avatar_emoji: null, avatar_color: null, iban: null,
    arrival: null, departure: null, blaze: null, drink: null, has_car: null,
    world_cup_team: null, mode: null }
}

function SettleUp({
  t, myId, byId, nameOf, expenses, payments,
}: {
  t: T
  myId: string
  byId: Map<string, Person>
  nameOf: (id: string) => string
  expenses: Expense[]
  payments: Payment[]
}) {
  const [iban, setIban] = useState('')
  const [pendingUndo, setPendingUndo] = useState<string | null>(null)
  const b = balances(expenses, payments)
  const transfers = suggestTransfers(b)
  const myBalance = b.get(myId) ?? 0
  const me = byId.get(myId)
  const settled = payments

  return (
    <section>
      <h2 className="marker-underline" style={{ marginBottom: 12 }}>{t('costs.settleUp')}</h2>

      {myBalance > 0 && me && !me.iban && (
        <Card style={{ marginBottom: 16 }}>
          <p style={{ ...fieldLabel, marginBottom: 8 }}>{t('costs.ibanPrompt')}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder={t('costs.ibanPlaceholder')}
              style={{ ...inputStyle, flex: 1, minWidth: 160, width: 'auto' }}
            />
            <button
              type="button"
              style={{ ...primaryBtn, opacity: iban.trim() === '' ? 0.4 : 1 }}
              disabled={iban.trim() === ''}
              onClick={() => people$[myId].iban.set(iban.trim())}
            >
              {t('common.save')}
            </button>
          </div>
        </Card>
      )}

      {transfers.length === 0 ? (
        <p>{t('costs.allSquare')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {transfers.map((tr) => {
            const payee = byId.get(tr.to)
            return (
              <Card key={`${tr.from}-${tr.to}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Badge person={byId.get(tr.from) ?? fallbackPerson(nameOf(tr.from))} size="sm" />
                  <span aria-hidden style={{ fontWeight: 700 }}>→</span>
                  <Badge person={payee ?? fallbackPerson(nameOf(tr.to))} size="sm" />
                  <span style={{ ...mono, fontWeight: 700, fontSize: 17, flex: 1, textAlign: 'right' }}>
                    {fmtCents(tr.amount)}
                  </span>
                </div>
                {payee?.iban && (
                  <p style={{ ...mono, fontSize: 13, margin: '8px 0 0', wordBreak: 'break-all' }}>{payee.iban}</p>
                )}
                <button
                  type="button"
                  style={{ ...primaryBtn, marginTop: 10 }}
                  onClick={() => {
                    const id = crypto.randomUUID()
                    payments$[id].set({ id, from_id: tr.from, to_id: tr.to, amount: tr.amount / 100 })
                  }}
                >
                  {t('costs.markPaid')}
                </button>
              </Card>
            )
          })}
        </div>
      )}

      {settled.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {settled.map((p) => {
            const armed = pendingUndo === p.id
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-label={t('costs.undoPayment')}
                  onClick={() => {
                    if (armed) {
                      payments$[p.id].deleted.set(true)
                      setPendingUndo(null)
                    } else {
                      setPendingUndo(p.id)
                    }
                  }}
                  style={{
                    fontFamily: 'inherit', fontSize: 13, textAlign: 'left', width: '100%',
                    background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0',
                    minHeight: 44, color: armed ? 'var(--color-tomato-text)' : 'var(--color-ink)',
                    fontWeight: armed ? 700 : 400, opacity: armed ? 1 : 0.7,
                  }}
                >
                  {armed
                    ? t('costs.tapToUndo')
                    : `${t('costs.settled', { from: nameOf(p.from_id), to: nameOf(p.to_id), amount: fmtEur(p.amount) })} ✓`}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

function ExpenseForm({
  t, people, myId, initial, onClose,
}: {
  t: T
  people: Person[]
  myId: string
  initial: Expense | null
  onClose: () => void
}) {
  const [label, setLabel] = useState(initial?.label ?? '')
  const [amount, setAmount] = useState(initial ? String(initial.amount) : '')
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [payerId, setPayerId] = useState(initial?.payer_id ?? myId)
  const [overrides, setOverrides] = useState<Record<string, boolean>>(() =>
    initial ? overridesFromExpense(initial) : {},
  )
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photo_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadFailed, setUploadFailed] = useState(false)

  const checked = checkedFor(people, overrides)
  const amountNum = parseAmount(amount)
  const canSave = label.trim() !== '' && amountNum > 0 && checked.size > 0

  // Per-person share of the current split, in cents, so each ticked person's
  // slice shows next to their name. Remainder cents land on the first ticked.
  const split =
    amountNum > 0 && checked.size > 0
      ? shares(Math.round(amountNum * 100), [...checked])
      : null
  const shareOf = (id: string) => {
    const c = split?.get(id)
    return c === undefined ? null : fmtCents(c)
  }

  const toggle = (id: string) =>
    setOverrides((o) => ({ ...o, [id]: !checked.has(id) }))

  const save = () => {
    const id = initial?.id ?? crypto.randomUUID()
    const row: Expense = {
      id,
      payer_id: payerId,
      amount: amountNum,
      label: label.trim(),
      date,
      participant_ids: [...checked],
      photo_url: photoUrl,
    }
    expenses$[id].set(row)
    onClose()
  }

  const everyone = () =>
    setOverrides(Object.fromEntries(people.map((p) => [p.id, true])))

  return (
    <div>
      <h2>{initial ? t('costs.editExpense') : t('costs.newExpense')}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 12 }}>
        <label>
          <span style={fieldLabel}>{t('costs.whatFor')}</span>
          <input type="text" value={label} onChange={(e) => setLabel(e.target.value)}
            placeholder={t('costs.labelPlaceholder')} style={inputStyle} />
        </label>

        <label>
          <span style={fieldLabel}>{t('costs.amount')}</span>
          <input type="text" inputMode="decimal" value={amount}
            placeholder="0.00"
            onChange={(e) => setAmount(e.target.value.replace(/[^0-9.,]/g, ''))}
            style={{ ...inputStyle, ...mono }} />
        </label>

        <label>
          <span style={fieldLabel}>{t('costs.date')}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </label>

        <div>
          <span style={fieldLabel}>{t('costs.whoPaid')}</span>
          <select value={payerId} onChange={(e) => setPayerId(e.target.value)} style={inputStyle}>
            {people.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ ...fieldLabel, marginBottom: 0 }}>{t('costs.splitBetween')}</span>
            <button
              type="button"
              onClick={everyone}
              disabled={checked.size === people.length}
              style={{
                fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                padding: '6px 12px', minHeight: 44, borderRadius: 9999, border: '2px solid var(--color-ink)',
                background: 'var(--color-sunny)', color: 'var(--color-ink)',
                opacity: checked.size === people.length ? 0.4 : 1,
              }}
            >
              {t('costs.everyone')}
            </button>
          </div>
          <PersonPicker people={people} selectedIds={checked} onToggle={toggle} noteOf={shareOf} />
        </div>

        <div>
          <span style={fieldLabel}>{t('costs.addPhoto')}</span>
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0]
              if (!file) return
              setUploading(true)
              setUploadFailed(false)
              try {
                setPhotoUrl(await uploadPhoto(file))
              } catch {
                setUploadFailed(true)
              } finally {
                setUploading(false)
              }
            }}
          />
          {uploading && <p style={{ fontSize: 13 }}>{t('costs.uploading')}</p>}
          {uploadFailed && !uploading && (
            <p style={{ fontSize: 13, color: 'var(--color-tomato-text)', fontWeight: 700 }}>{t('common.uploadFailed')}</p>
          )}
          {photoUrl && !uploading && (
            <img src={photoUrl} alt="" style={{ marginTop: 8, width: 80, height: 80, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--color-ink)' }} />
          )}
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="button" onClick={onClose} className="back-chip">{t('common.cancel')}</button>
          <button type="button" onClick={save} disabled={!canSave}
            style={{ ...primaryBtn, flex: 1, fontSize: 17, padding: '14px 24px', minHeight: 48, opacity: canSave ? 1 : 0.4 }}>
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
