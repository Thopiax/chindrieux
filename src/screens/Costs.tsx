import { useEffect, useState, type CSSProperties } from 'react'
import { use$ } from '@legendapp/state/react'
import { Badge } from '../components/Badge.tsx'
import { Card } from '../components/Card.tsx'
import { Screen } from '../components/Screen.tsx'
import { lang$, useT, type Lang } from '../i18n.ts'
import { myId$ } from '../identity.ts'
import { expenses$, payments$, people$, useRows } from '../store.ts'
import { balances, expenseShares, expenseTotal, suggestTransfers } from '../domain/money.ts'
import type { Expense, Payment, Person } from '../domain/types.ts'
import { isPresentOn } from '../domain/presence.ts'
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
const hint: CSSProperties = { fontSize: 13, fontWeight: 700, opacity: 0.65 }

// yyyy-mm-dd anchored at local noon so toLocaleDateString never drifts a day.
function fmtDate(iso: string, lang: Lang): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString(lang, { day: 'numeric', month: 'short' })
}

// Two-tap confirm state (delete / undo) that disarms itself after a beat.
function useArmed(): [string | null, (id: string | null) => void] {
  const [armed, setArmed] = useState<string | null>(null)
  useEffect(() => {
    if (armed === null) return
    const id = setTimeout(() => setArmed(null), 4000)
    return () => clearTimeout(id)
  }, [armed])
  return [armed, setArmed]
}

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
// We deliberately do not pre-select present people (too easy to miss an unwanted
// tick); the guest picks the split explicitly.
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
  const lang = use$(lang$)
  const myId = use$(myId$) as string
  const people = useRows(people$)
  // Newest first: by date, then by creation time. useRows returns a fresh
  // array each render, so sorting in place is fine. Fields are guarded because
  // a partially synced row can surface with them briefly undefined.
  const expenses = useRows(expenses$).sort(
    (a, z) => (z.date ?? '').localeCompare(a.date ?? '') || (z.created_at ?? '').localeCompare(a.created_at ?? ''),
  )
  const payments = useRows(payments$)

  // Closed, adding, or editing a specific expense. The form remounts fresh each
  // time it opens (keyed below) so its selection starts empty again.
  // Arriving via '#/costs?new' (the home screen's one-tap) opens the add form.
  const [form, setForm] = useState<{ mode: 'add' } | { mode: 'edit'; expense: Expense } | null>(
    () => (routeQuery().has('new') ? { mode: 'add' } : null),
  )
  const [tab, setTab] = useState<'expenses' | 'settle'>('expenses')
  const [pendingDelete, setPendingDelete] = useArmed()

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
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {([['expenses', t('costs.expenses')], ['settle', t('costs.settleUp')]] as const).map(([key, label]) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            style={{
              fontFamily: 'inherit', fontWeight: 700, fontSize: 15, cursor: 'pointer',
              padding: '8px 18px', minHeight: 44, borderRadius: 9999,
              border: '2px solid var(--color-ink)', color: 'var(--color-ink)',
              background: tab === key ? 'var(--color-sunny)' : 'transparent',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'settle' ? (
        <SettleUp t={t} myId={myId} byId={byId} nameOf={nameOf} expenses={expenses} payments={payments} people={people} />
      ) : (
        <>
      <button
        type="button"
        className="big-red"
        style={{ margin: '0 0 24px' }}
        onClick={() => setForm({ mode: 'add' })}
      >
        {t('costs.addExpense')}
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, marginBottom: 24 }}>
        {expenses.length === 0 ? (
          <p>{t('costs.empty')}</p>
        ) : (
          expenses.map((e) => (
            <Card key={e.id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 18, display: 'block', marginBottom: 2 }}>{e.label}</strong>
                  {e.date && (
                    <p style={{ ...hint, margin: '0 0 8px' }}>
                      {fmtDate(e.date, lang)}
                      {e.end_date && e.end_date > e.date ? ` → ${fmtDate(e.end_date, lang)}` : ''}
                    </p>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Badge person={byId.get(e.payer_id) ?? fallbackPerson(nameOf(e.payer_id))} size="sm" />
                    <span style={{ fontWeight: 700, fontSize: 15 }}>{nameOf(e.payer_id)}</span>
                    <span style={{ ...mono, fontWeight: 700, fontSize: 18, flex: 1, textAlign: 'right' }}>{fmtCents(expenseTotal(e, people))}</span>
                  </div>
                  {e.per_head && (
                    <p style={{ ...hint, margin: '0 0 8px' }}>
                      {t('costs.perHeadNote', { rate: fmtEur(e.amount) })}
                    </p>
                  )}
                  {(() => {
                    // The "why" behind the settle-up number: my slice of this expense.
                    const myShare = expenseShares(e, people).get(myId)
                    return myShare ? (
                      <p style={{ ...hint, margin: '0 0 8px' }}>
                        {t('costs.yourShare', { amount: fmtCents(myShare) })}
                      </p>
                    ) : null
                  })()}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {(e.participant_ids ?? []).map((id) => (
                      <Badge key={id} person={byId.get(id) ?? fallbackPerson(nameOf(id))} size="sm" nameTap />
                    ))}
                  </div>
                </div>
                {e.photo_url && (
                  <img
                    src={e.photo_url}
                    alt={e.label}
                    loading="lazy"
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
        </>
      )}
    </Screen>
  )
}

function fallbackPerson(name: string): Person {
  return { id: '', name, avatar_emoji: null, avatar_color: null, iban: null,
    arrival: null, departure: null, blaze: null, drink: null, has_car: null,
    world_cup_team: null, mode: null }
}

function SettleUp({
  t, myId, byId, nameOf, expenses, payments, people,
}: {
  t: T
  myId: string
  byId: Map<string, Person>
  nameOf: (id: string) => string
  expenses: Expense[]
  payments: Payment[]
  people: Person[]
}) {
  const [iban, setIban] = useState('')
  const [pendingUndo, setPendingUndo] = useArmed()
  const b = balances(expenses, payments, people)
  let totalAll = 0, myTotal = 0
  for (const e of expenses) {
    totalAll += expenseTotal(e, people)
    myTotal += expenseShares(e, people).get(myId) ?? 0
  }
  // My transfers first: what I owe, then what I'm owed, then everyone else's.
  const involvesMe = (tr: { from: string; to: string }) =>
    tr.from === myId ? 2 : tr.to === myId ? 1 : 0
  const transfers = suggestTransfers(b).sort((a, z) => involvesMe(z) - involvesMe(a))
  const myBalance = b.get(myId) ?? 0
  const me = byId.get(myId)
  const settled = payments

  return (
    <section>
      {myBalance !== 0 && (
        <p
          style={{
            fontSize: 22, fontWeight: 700, margin: '0 0 12px',
            color: myBalance < 0 ? 'var(--color-tomato-text)' : 'var(--color-ink)',
          }}
        >
          {myBalance < 0
            ? t('costs.youOwe', { amount: fmtCents(-myBalance) })
            : t('costs.youAreOwed', { amount: fmtCents(myBalance) })}
        </p>
      )}

      {totalAll > 0 && (
        <p style={{ ...hint, margin: '0 0 12px' }}>
          {t('costs.totalSoFar', { total: fmtCents(totalAll), mine: fmtCents(myTotal) })}
        </p>
      )}

      {myBalance > 0 && me && !me.iban && (
        <Card style={{ marginBottom: 16 }}>
          <p style={{ ...fieldLabel, marginBottom: 8 }}>{t('costs.ibanPrompt')}</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder={t('costs.ibanPlaceholder')}
              spellCheck={false}
              autoComplete="off"
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {transfers.map((tr) => {
            const payee = byId.get(tr.to)
            return (
              <Card key={`${tr.from}-${tr.to}`}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Badge person={byId.get(tr.from) ?? fallbackPerson(nameOf(tr.from))} size="sm" />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{nameOf(tr.from)}</span>
                  <span aria-hidden style={{ fontWeight: 700 }}>→</span>
                  <Badge person={payee ?? fallbackPerson(nameOf(tr.to))} size="sm" />
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{nameOf(tr.to)}</span>
                  <span style={{ ...mono, fontWeight: 700, fontSize: 17, flex: 1, textAlign: 'right' }}>
                    {fmtCents(tr.amount)}
                  </span>
                </div>
                {payee?.iban && <CopyIban t={t} iban={payee.iban} />}
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
            const line = t('costs.settled', { from: nameOf(p.from_id), to: nameOf(p.to_id), amount: fmtEur(p.amount) })
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-label={`${line}. ${t('costs.undoPayment')}`}
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
                  {armed ? t('costs.tapToUndo') : `${line} ✓`}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

// The payee's IBAN as a tap-to-copy button, so it can go straight into a
// banking app instead of being finger-selected out of a mono string.
function CopyIban({ t, iban }: { t: T; iban: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(iban.replaceAll(' ', ''))
        } catch {
          return
        }
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      style={{
        fontFamily: 'inherit', textAlign: 'left', width: '100%', cursor: 'pointer',
        background: 'none', border: 'none', padding: '8px 0 0', minHeight: 44,
      }}
    >
      <span style={{ ...mono, fontSize: 13, wordBreak: 'break-all', display: 'block' }}>{iban}</span>
      <span style={{ ...hint, color: copied ? 'var(--color-grass)' : 'var(--color-cerulean)', opacity: 1 }}>
        {copied ? t('costs.copied') : t('costs.copyIban')}
      </span>
    </button>
  )
}

function groupByPresence(people: Person[], date: string) {
  const here: Person[] = []
  const gone: Person[] = []
  const noDates: Person[] = []
  for (const p of people) {
    if (p.arrival === null || p.departure === null) noDates.push(p)
    else if (isPresentOn(p, date)) here.push(p)
    else gone.push(p)
  }
  return { here, gone, noDates }
}

function CollapsibleSection({
  title, people, defaultOpen, children,
}: {
  title: string
  people: Person[]
  defaultOpen: boolean
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)
  if (people.length === 0) return null
  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{
          fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer',
          background: 'none', border: 'none', padding: '6px 0', minHeight: 36,
          color: 'var(--color-ink)', display: 'flex', alignItems: 'center', gap: 6,
        }}
      >
        <span style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
          ▶
        </span>
        {title} ({people.length})
      </button>
      {open && children}
    </div>
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
  const [perHead, setPerHead] = useState(initial?.per_head ?? false)
  const [date, setDate] = useState(initial?.date ?? todayISO())
  const [endDate, setEndDate] = useState(initial?.end_date ?? '')
  const [payerId, setPayerId] = useState(initial?.payer_id ?? myId)
  const [overrides, setOverrides] = useState<Record<string, boolean>>(() =>
    initial ? overridesFromExpense(initial) : {},
  )
  const [photoUrl, setPhotoUrl] = useState<string | null>(initial?.photo_url ?? null)
  const [uploading, setUploading] = useState(false)
  const [uploadFailed, setUploadFailed] = useState(false)
  const [customMode, setCustomMode] = useState(() => initial?.custom_shares != null)
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(() => {
    if (initial?.custom_shares) {
      const out: Record<string, string> = {}
      for (const [id, v] of Object.entries(initial.custom_shares)) out[id] = String(v)
      return out
    }
    return {}
  })

  const ranged = endDate > date
  const checked = checkedFor(people, overrides)
  const amountNum = parseAmount(amount)
  const totalCents = amountNum > 0 ? Math.round(amountNum * 100) : 0

  // Per-person share of the current split, so each ticked person's slice shows
  // next to their name. Built from a draft expense so it honours per-head and
  // date-range weighting exactly like the saved split will.
  const draft: Expense = {
    id: '', payer_id: payerId, amount: amountNum, label, date,
    participant_ids: [...checked], photo_url: null,
    end_date: ranged ? endDate : null, per_head: perHead,
  }
  const split = amountNum > 0 && checked.size > 0 ? expenseShares(draft, people) : null

  const customTotal = customMode
    ? [...checked].reduce((sum, id) => sum + Math.round(parseAmount(customAmounts[id] ?? '0') * 100), 0)
    : totalCents
  const diff = totalCents - customTotal
  const customValid = !customMode || diff === 0

  const canSave = label.trim() !== '' && amountNum > 0 && checked.size > 0 && customValid


  const shareOf = (id: string) => {
    if (!checked.has(id)) return null
    if (customMode) {
      const v = parseAmount(customAmounts[id] ?? '0')
      return Number.isFinite(v) && v > 0 ? fmtEur(v) : null
    }
    const c = split?.get(id)
    return c === undefined ? null : fmtCents(c)
  }

  const toggle = (id: string) => {
    const nowChecked = !checked.has(id)
    setOverrides((o) => ({ ...o, [id]: nowChecked }))
    if (!nowChecked && customMode) {
      setCustomAmounts((a) => { const next = { ...a }; delete next[id]; return next })
    }
  }

  const setCustomAmount = (id: string, raw: string) => {
    setCustomAmounts((a) => ({ ...a, [id]: raw.replace(/[^0-9.,]/g, '') }))
  }

  const save = () => {
    const id = initial?.id ?? crypto.randomUUID()
    let cs: Record<string, number> | null = null
    if (customMode) {
      cs = {}
      for (const pid of checked) cs[pid] = parseAmount(customAmounts[pid] ?? '0')
    }
    const row: Expense = {
      id,
      payer_id: payerId,
      amount: amountNum,
      label: label.trim(),
      date,
      participant_ids: [...checked],
      photo_url: photoUrl,
      end_date: ranged ? endDate : null,
      per_head: perHead,
      custom_shares: cs,
    }
    expenses$[id].set(row)
    onClose()
  }

  const everyone = () =>
    setOverrides(Object.fromEntries(people.map((p) => [p.id, true])))
  // Profile-flag quick picks; both are missing-flag-friendly: unset drink means
  // "doesn't drink", unset eats_meat means "eats meat" (vegetarians opt out).
  const drinkers = () =>
    setOverrides(Object.fromEntries(people.map((p) => [p.id, p.drink === true])))
  const meatEaters = () =>
    setOverrides(Object.fromEntries(people.map((p) => [p.id, p.eats_meat !== false])))

  const toggleCustomMode = () => {
    if (!customMode && split) {
      const seeded: Record<string, string> = {}
      for (const [id, cents] of split) seeded[id] = (cents / 100).toFixed(2)
      setCustomAmounts(seeded)
    }
    setCustomMode((m) => !m)
  }

  const { here, gone, noDates } = groupByPresence(people, date)

  const renderRow = (p: Person) => {
    const note = shareOf(p.id)
    return (
      <label
        key={p.id}
        style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, cursor: 'pointer' }}
      >
        <input
          type="checkbox"
          checked={checked.has(p.id)}
          onChange={() => toggle(p.id)}
          style={{ width: 20, height: 20 }}
        />
        <Badge person={p} size="sm" />
        <span style={{ flex: 1 }}>{p.name}</span>
        {customMode && checked.has(p.id) ? (
          <input
            type="text"
            inputMode="decimal"
            value={customAmounts[p.id] ?? ''}
            placeholder="0.00"
            onChange={(e) => setCustomAmount(p.id, e.target.value)}
            style={{
              ...mono, width: 80, fontSize: 14, padding: '4px 8px', borderRadius: 6,
              border: '2px solid var(--color-ink)', textAlign: 'right',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          note !== null && (
            <span style={{ marginLeft: 'auto', ...mono, fontSize: 14, opacity: 0.75 }}>
              {note}
            </span>
          )
        )}
      </label>
    )
  }

  const renderGroup = (group: Person[]) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {group.map(renderRow)}
    </div>
  )

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

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, minHeight: 44 }}>
          <input
            type="checkbox"
            checked={perHead}
            onChange={(e) => setPerHead(e.target.checked)}
            style={{ width: 20, height: 20 }}
          />
          {t('costs.perHead')}
        </label>

        <label>
          <span style={fieldLabel}>{t('costs.date')}</span>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </label>

        <label>
          <span style={fieldLabel}>{t('costs.until')}</span>
          <input
            type="date"
            value={endDate}
            min={date}
            onChange={(e) => setEndDate(e.target.value)}
            style={inputStyle}
          />
          {ranged && (
            <p style={{ fontSize: 13, fontWeight: 700, opacity: 0.65, margin: '6px 0 0' }}>
              {t('costs.perDayHint')}
            </p>
          )}
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
          <span style={fieldLabel}>{t('costs.splitBetween')}</span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
            {[
              { label: t('costs.everyone'), pick: everyone },
              { label: `🍷 ${t('costs.drinkers')}`, pick: drinkers },
              { label: `🥩 ${t('costs.meatEaters')}`, pick: meatEaters },
            ].map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.pick}
                style={{
                  fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  padding: '6px 12px', minHeight: 44, borderRadius: 9999, border: '2px solid var(--color-ink)',
                  background: 'var(--color-sunny)', color: 'var(--color-ink)',
                }}
              >
                {chip.label}
              </button>
            ))}
            {checked.size > 0 && amountNum > 0 && (
              <button
                type="button"
                onClick={toggleCustomMode}
                style={{
                  fontFamily: 'inherit', fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  padding: '6px 12px', minHeight: 44, borderRadius: 9999, border: '2px solid var(--color-ink)',
                  background: customMode ? 'var(--color-cerulean)' : 'transparent',
                  color: customMode ? '#fff' : 'var(--color-ink)',
                }}
              >
                {customMode ? t('costs.equalSplit') : t('costs.customAmounts')}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {here.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.6, marginBottom: 6 }}>
                  {t('costs.hereOnDate')}
                </div>
                {renderGroup(here)}
              </div>
            )}

            <CollapsibleSection title={t('costs.goneOnDate')} people={gone} defaultOpen={gone.some((p) => checked.has(p.id))}>
              {renderGroup(gone)}
            </CollapsibleSection>

            <CollapsibleSection title={t('costs.noDates')} people={noDates} defaultOpen={noDates.some((p) => checked.has(p.id))}>
              {renderGroup(noDates)}
            </CollapsibleSection>
          </div>

          {customMode && amountNum > 0 && diff !== 0 && (
            <p style={{
              ...mono, fontSize: 13, marginTop: 8, fontWeight: 700,
              color: 'var(--color-tomato-text)',
            }}>
              {diff > 0
                ? t('costs.remaining', { amount: fmtCents(diff) })
                : t('costs.over', { amount: fmtCents(-diff) })}
            </p>
          )}
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
