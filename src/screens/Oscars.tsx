import { useState, type CSSProperties } from 'react'
import { use$ } from '@legendapp/state/react'
import { Badge } from '../components/Badge.tsx'
import { Card } from '../components/Card.tsx'
import { Screen } from '../components/Screen.tsx'
import { useT } from '../i18n.ts'
import { myId$ } from '../identity.ts'
import { config$, nominations$, oscarCategories$, people$, votes$, useRows } from '../store.ts'
import { tally, winners } from '../domain/oscars.ts'
import type { Nomination, OscarCategory, OscarsPhase, Person, Vote } from '../domain/types.ts'
import { uploadPhoto } from '../photos.ts'

type T = ReturnType<typeof useT>

const PHASES: readonly OscarsPhase[] = ['proposing', 'voting', 'revealed']
const phaseKey: Record<OscarsPhase, string> = {
  proposing: 'oscars.phase.propose',
  voting: 'oscars.phase.vote',
  revealed: 'oscars.phase.reveal',
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

// Minimal stand-in badge for an id whose person row is gone (e.g. deleted).
function fallbackPerson(name: string): Person {
  return { id: '', name, avatar_emoji: null, avatar_color: null, iban: null,
    arrival: null, departure: null, blaze: null, drink: null, has_car: null,
    world_cup_team: null, mode: null }
}

export function Oscars() {
  const t = useT()
  const myId = use$(myId$) as string
  const phase = use$(() => config$['main'].oscars_phase.get() ?? 'proposing')

  const people = useRows(people$)
  const categories = useRows(oscarCategories$)
  const nominations = useRows(nominations$)
  const votes = useRows(votes$)

  const byId = new Map(people.map((p) => [p.id, p]))
  const personOf = (id: string) => byId.get(id) ?? fallbackPerson('?')

  if (phase === 'revealed') {
    return (
      <Ceremony
        t={t}
        categories={categories}
        nominations={nominations}
        votes={votes}
        personOf={personOf}
      />
    )
  }

  return (
    <Screen title={t('oscars.title')}>
      {phase === 'proposing' ? (
        <Proposing t={t} myId={myId} categories={categories} nominations={nominations} personOf={personOf} />
      ) : (
        <Voting t={t} myId={myId} categories={categories} nominations={nominations} votes={votes} />
      )}
      <PhaseFooter t={t} phase={phase} />
    </Screen>
  )
}

// ponytail: no host role, trust the group. Everyone sees the same three buttons.
function PhaseFooter({ t, phase, dark = false }: { t: T; phase: OscarsPhase; dark?: boolean }) {
  const activeBg = dark ? 'var(--color-sunny)' : 'var(--color-cerulean)'
  const activeColor = dark ? '#2B2B2B' : '#fff'
  const idleColor = dark ? 'rgba(255,255,255,0.75)' : 'var(--color-ink)'
  const border = dark ? '2px solid rgba(255,210,63,0.5)' : '2px solid var(--color-ink)'
  return (
    <nav
      aria-label={t('oscars.phaseAria')}
      style={{ display: 'flex', gap: 8, marginTop: 28, justifyContent: 'center' }}
    >
      {PHASES.map((p) => {
        const active = p === phase
        return (
          <button
            key={p}
            type="button"
            aria-pressed={active}
            onClick={() => config$['main'].oscars_phase.set(p)}
            style={{
              fontFamily: 'inherit', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              borderRadius: 9999, padding: '8px 16px', border,
              background: active ? activeBg : 'transparent',
              color: active ? activeColor : idleColor,
            }}
          >
            {t(phaseKey[p])}
          </button>
        )
      })}
    </nav>
  )
}

// -------------------- Proposing --------------------

function Proposing({
  t, myId, categories, nominations, personOf,
}: {
  t: T
  myId: string
  categories: OscarCategory[]
  nominations: Nomination[]
  personOf: (id: string) => Person
}) {
  const [addingCategory, setAddingCategory] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginBottom: 20 }}>
        {categories.length === 0 ? (
          <p>{t('oscars.emptyCategories')}</p>
        ) : (
          categories.map((c) => (
            <Card key={c.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <strong style={{ fontSize: 20, flex: 1 }}>{c.name}</strong>
                <button
                  type="button"
                  style={{ ...ghostBtn, color: 'var(--color-tomato-text)' }}
                  onClick={() => {
                    if (pendingDelete === c.id) {
                      oscarCategories$[c.id].deleted.set(true)
                      setPendingDelete(null)
                    } else {
                      setPendingDelete(c.id)
                    }
                  }}
                >
                  {pendingDelete === c.id ? t('oscars.tapAgain') : t('common.delete')}
                </button>
              </div>
              <NominationList
                t={t}
                nominations={nominations.filter((n) => n.category_id === c.id)}
                personOf={personOf}
              />
              <NominationForm t={t} categoryId={c.id} myId={myId} />
            </Card>
          ))
        )}
      </div>

      {addingCategory ? (
        <CategoryForm t={t} onClose={() => setAddingCategory(false)} />
      ) : (
        <button type="button" style={primaryBtn} onClick={() => setAddingCategory(true)}>
          {t('oscars.newCategory')}
        </button>
      )}
    </div>
  )
}

function NominationList({
  t, nominations, personOf,
}: {
  t: T
  nominations: Nomination[]
  personOf: (id: string) => Person
}) {
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  if (nominations.length === 0) {
    return <p style={{ opacity: 0.6, margin: '0 0 12px' }}>{t('oscars.emptyNominations')}</p>
  }
  return (
    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {nominations.map((n) => (
        <li key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {n.photo_url && (
            <img
              src={n.photo_url}
              alt=""
              style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--color-ink)' }}
            />
          )}
          <span style={{ flex: 1, fontWeight: 600 }}>{n.title}</span>
          <Badge person={personOf(n.proposed_by)} size="sm" />
          <button
            type="button"
            style={{ ...ghostBtn, color: 'var(--color-tomato-text)' }}
            onClick={() => {
              if (pendingDelete === n.id) {
                nominations$[n.id].deleted.set(true)
                setPendingDelete(null)
              } else {
                setPendingDelete(n.id)
              }
            }}
            aria-label={t('common.delete')}
          >
            {pendingDelete === n.id ? t('oscars.tapAgain') : '✕'}
          </button>
        </li>
      ))}
    </ul>
  )
}

function NominationForm({ t, categoryId, myId }: { t: T; categoryId: string; myId: string }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadFailed, setUploadFailed] = useState(false)

  const canSave = title.trim() !== ''

  const save = () => {
    const id = crypto.randomUUID()
    const row: Nomination = {
      id, category_id: categoryId, title: title.trim(), photo_url: photoUrl, proposed_by: myId,
    }
    nominations$[id].set(row)
    setTitle('')
    setPhotoUrl(null)
    setOpen(false)
  }

  if (!open) {
    return (
      <button type="button" style={ghostBtn} onClick={() => setOpen(true)}>
        {t('oscars.nominate')}
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
      <label>
        <span style={fieldLabel}>{t('oscars.momentTitle')}</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('oscars.momentPlaceholder')}
          style={inputStyle}
        />
      </label>
      <div>
        <span style={fieldLabel}>{t('oscars.addPhoto')}</span>
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
        {uploading && <p style={{ fontSize: 13 }}>{t('oscars.uploading')}</p>}
        {uploadFailed && !uploading && (
          <p style={{ fontSize: 13, color: 'var(--color-tomato-text)', fontWeight: 700 }}>{t('common.uploadFailed')}</p>
        )}
        {photoUrl && !uploading && (
          <img src={photoUrl} alt="" style={{ marginTop: 8, width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--color-ink)' }} />
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" onClick={save} disabled={!canSave}
          style={{ ...primaryBtn, opacity: canSave ? 1 : 0.4 }}>
          {t('oscars.submitNomination')}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="back-chip">{t('common.cancel')}</button>
      </div>
    </div>
  )
}

function CategoryForm({ t, onClose }: { t: T; onClose: () => void }) {
  const [name, setName] = useState('')
  const canCreate = name.trim() !== ''

  const create = () => {
    const id = crypto.randomUUID()
    const row: OscarCategory = { id, name: name.trim() }
    oscarCategories$[id].set(row)
    onClose()
  }

  return (
    <Card>
      <label>
        <span style={fieldLabel}>{t('oscars.categoryName')}</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('oscars.categoryPlaceholder')}
          style={inputStyle}
        />
      </label>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
        <button type="button" onClick={create} disabled={!canCreate}
          style={{ ...primaryBtn, opacity: canCreate ? 1 : 0.4 }}>
          {t('oscars.createCategory')}
        </button>
        <button type="button" onClick={onClose} className="back-chip">{t('common.cancel')}</button>
      </div>
    </Card>
  )
}

// -------------------- Voting --------------------

function Voting({
  t, myId, categories, nominations, votes,
}: {
  t: T
  myId: string
  categories: OscarCategory[]
  nominations: Nomination[]
  votes: Vote[]
}) {
  if (categories.length === 0) {
    return <p>{t('oscars.emptyCategories')}</p>
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {categories.map((c) => (
        <VotingCategory
          key={c.id}
          t={t}
          myId={myId}
          category={c}
          nominations={nominations.filter((n) => n.category_id === c.id)}
          votes={votes}
        />
      ))}
    </div>
  )
}

function VotingCategory({
  t, myId, category, nominations, votes,
}: {
  t: T
  myId: string
  category: OscarCategory
  nominations: Nomination[]
  votes: Vote[]
}) {
  // My single live vote for this category, if any. Enforced by upsert-replace
  // below, since the votes table has no DB unique constraint on (category, voter).
  const myVote = votes.find((v) => v.category_id === category.id && v.voter_id === myId)

  // Tap a nomination: replace my existing vote in this category (move it), toggle
  // it off if I tap the one I already picked, or insert a first vote. Never a
  // second live vote row for the same voter and category.
  const vote = (nominationId: string) => {
    if (myVote) {
      if (myVote.nomination_id === nominationId) {
        votes$[myVote.id].deleted.set(true)
      } else {
        votes$[myVote.id].nomination_id.set(nominationId)
      }
      return
    }
    const id = crypto.randomUUID()
    const row: Vote = { id, category_id: category.id, nomination_id: nominationId, voter_id: myId }
    votes$[id].set(row)
  }

  return (
    <section>
      <h2 className="marker-underline" style={{ marginBottom: 12 }}>{category.name}</h2>
      {nominations.length === 0 ? (
        <p style={{ opacity: 0.6 }}>{t('oscars.emptyNominations')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {nominations.map((n) => {
            const mine = myVote?.nomination_id === n.id
            return (
              <button
                key={n.id}
                type="button"
                aria-pressed={mine}
                onClick={() => vote(n.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%', textAlign: 'left',
                  font: 'inherit', color: 'var(--color-ink)', cursor: 'pointer',
                  background: mine ? 'var(--color-sunny)' : '#fff',
                  border: mine ? '3px solid var(--color-ink)' : '2px solid rgba(43,43,43,0.25)',
                  borderRadius: 12, padding: 14,
                }}
              >
                {n.photo_url && (
                  <img
                    src={n.photo_url}
                    alt=""
                    style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '2px solid var(--color-ink)' }}
                  />
                )}
                <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>{n.title}</span>
                {mine && <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{t('oscars.youVoted')}</span>}
              </button>
            )
          })}
        </div>
      )}
    </section>
  )
}

// -------------------- Revealed (ceremony) --------------------

// Deliberately dark: award ceremonies happen in dark rooms. Scoped to this
// component only via inline styles, so the light app shell never changes.
function Ceremony({
  t, categories, nominations, votes, personOf,
}: {
  t: T
  categories: OscarCategory[]
  nominations: Nomination[]
  votes: Vote[]
  personOf: (id: string) => Person
}) {
  const phase = use$(() => config$['main'].oscars_phase.get() ?? 'proposing')
  const winnerByCategory = winners(votes, nominations)
  const nominationById = new Map(nominations.map((n) => [n.id, n]))

  const gold = '#F5C542'
  const linkStyle: CSSProperties = { color: gold, fontWeight: 700, textDecoration: 'none' }

  return (
    <div
      style={{
        background: 'radial-gradient(circle at 50% 0%, #2a1f3d 0%, #140d22 55%, #0a0713 100%)',
        color: '#fff', borderRadius: 16, padding: '20px 16px 28px', margin: '-4px 0',
      }}
    >
      <a href="#/" style={{ ...linkStyle, display: 'inline-block', marginBottom: 8 }}>
        {'← '}{t('screen.backToToday')}
      </a>

      <h1 style={{ color: gold, fontSize: 34, textAlign: 'center', margin: '8px 0 4px' }}>
        {'🏆 '}{t('oscars.ceremonyTitle')}
      </h1>

      {categories.length === 0 ? (
        <p style={{ textAlign: 'center', opacity: 0.7 }}>{t('oscars.emptyReveal')}</p>
      ) : (
        <>
          <p style={{ textAlign: 'center', opacity: 0.6, fontSize: 13, marginBottom: 4 }}>
            {t('oscars.scrollHint')}
          </p>
          {categories.map((c) => {
            const winnerId = winnerByCategory.get(c.id) ?? null
            const winner = winnerId ? nominationById.get(winnerId) ?? null : null
            const count = winnerId ? tally(votes, c.id).get(winnerId) ?? 0 : 0
            return (
              <section
                key={c.id}
                style={{
                  minHeight: '80vh', display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                  padding: '24px 8px',
                  background: winner
                    ? 'radial-gradient(circle at 50% 38%, rgba(245,197,66,0.16) 0%, transparent 60%)'
                    : 'none',
                }}
              >
                <p style={{ textTransform: 'uppercase', letterSpacing: 2, fontSize: 13, opacity: 0.7, margin: 0 }}>
                  {t('oscars.winnerIs')}
                </p>
                <h2 style={{ color: gold, fontSize: 28, margin: '10px 0 20px' }}>{c.name}</h2>

                {winner ? (
                  <>
                    {winner.photo_url && (
                      <img
                        src={winner.photo_url}
                        alt=""
                        style={{
                          width: 200, maxWidth: '80%', aspectRatio: '1 / 1', objectFit: 'cover',
                          borderRadius: 16, border: `4px solid ${gold}`,
                          boxShadow: `0 0 40px rgba(245,197,66,0.4)`, marginBottom: 20,
                        }}
                      />
                    )}
                    <p style={{ fontSize: 30, fontWeight: 800, fontFamily: 'var(--font-display)', margin: '0 0 16px', maxWidth: '90%' }}>
                      {'🏆 '}{winner.title}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <Badge person={personOf(winner.proposed_by)} size="md" />
                    </div>
                    <p style={{ color: gold, fontWeight: 700, fontSize: 18, margin: 0 }}>
                      {t('oscars.votes', { n: count })}
                    </p>
                  </>
                ) : (
                  <p style={{ opacity: 0.6, fontSize: 18 }}>{t('oscars.noVotesYet')}</p>
                )}
              </section>
            )
          })}
        </>
      )}

      <PhaseFooter t={t} phase={phase} dark />
    </div>
  )
}
