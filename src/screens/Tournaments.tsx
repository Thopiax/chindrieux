import { useState, type CSSProperties } from 'react'
import { Badge } from '../components/Badge.tsx'
import { Card } from '../components/Card.tsx'
import { Screen } from '../components/Screen.tsx'
import { useT } from '../i18n.ts'
import { matches$, people$, tournaments$, useRows } from '../store.ts'
import { standings } from '../domain/standings.ts'
import type { Game, Match, Person, Tournament } from '../domain/types.ts'
import { todayISO } from '../today.ts'

type T = ReturnType<typeof useT>

const GAMES: readonly Game[] = ['pingpong', 'chess', 'foosball']
const gameEmoji: Record<Game, string> = { pingpong: '🏓', chess: '♟️', foosball: '⚽' }

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

// Minimal stand-in badge for an id whose person row is gone (e.g. deleted).
function fallbackPerson(name: string): Person {
  return { id: '', name, avatar_emoji: null, avatar_color: null, iban: null,
    arrival: null, departure: null, blaze: null, drink: null, has_car: null,
    world_cup_team: null, mode: null }
}

export function Tournaments() {
  const t = useT()
  const people = useRows(people$)
  const tournaments = useRows(tournaments$)
  const matches = useRows(matches$)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  // A selected tournament can vanish (deleted on another device): fall back to
  // the list rather than rendering a detail for a ghost.
  const selected = selectedId ? tournaments.find((tr) => tr.id === selectedId) : null

  if (selected) {
    return (
      <Screen title={`${gameEmoji[selected.game]} ${selected.name}`}>
        <TournamentDetail
          t={t}
          tournament={selected}
          people={people}
          matches={matches.filter((m) => m.tournament_id === selected.id)}
          onBack={() => setSelectedId(null)}
        />
      </Screen>
    )
  }

  return (
    <Screen title={t('tournaments.title')}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
        {tournaments.length === 0 ? (
          <p>{t('tournaments.empty')}</p>
        ) : (
          tournaments.map((tr) => (
            <Card key={tr.id}>
              <button
                type="button"
                onClick={() => setSelectedId(tr.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, width: '100%',
                  background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  font: 'inherit', color: 'var(--color-ink)', textAlign: 'left',
                }}
              >
                <span aria-hidden style={{ fontSize: 28, lineHeight: 1 }}>{gameEmoji[tr.game]}</span>
                <span style={{ fontWeight: 700, fontSize: 18 }}>{tr.name}</span>
                <span aria-hidden style={{ marginLeft: 'auto', fontWeight: 700 }}>→</span>
              </button>
            </Card>
          ))
        )}
      </div>

      {adding ? (
        <NewTournamentForm t={t} onClose={() => setAdding(false)} />
      ) : (
        <button type="button" style={primaryBtn} onClick={() => setAdding(true)}>
          {t('tournaments.newTournament')}
        </button>
      )}
    </Screen>
  )
}

function NewTournamentForm({ t, onClose }: { t: T; onClose: () => void }) {
  const [name, setName] = useState('')
  const [game, setGame] = useState<Game>('pingpong')
  const canCreate = name.trim() !== ''

  const create = () => {
    const id = crypto.randomUUID()
    const row: Tournament = { id, name: name.trim(), game }
    tournaments$[id].set(row)
    onClose()
  }

  return (
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <label>
          <span style={fieldLabel}>{t('tournaments.name')}</span>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            placeholder={t('tournaments.namePlaceholder')} style={inputStyle} />
        </label>

        <div>
          <span style={fieldLabel}>{t('tournaments.game')}</span>
          <select value={game} onChange={(e) => setGame(e.target.value as Game)} style={inputStyle}>
            {GAMES.map((g) => (
              <option key={g} value={g}>{`${gameEmoji[g]} ${t(`tournaments.game.${g}`)}`}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button type="button" onClick={create} disabled={!canCreate}
            style={{ ...primaryBtn, opacity: canCreate ? 1 : 0.4 }}>
            {t('tournaments.create')}
          </button>
          <button type="button" onClick={onClose} className="back-chip">{t('common.cancel')}</button>
        </div>
      </div>
    </Card>
  )
}

function TournamentDetail({
  t, tournament, people, matches, onBack,
}: {
  t: T
  tournament: Tournament
  people: Person[]
  matches: Match[]
  onBack: () => void
}) {
  const [winnerId, setWinnerId] = useState('')
  const [loserId, setLoserId] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const byId = new Map(people.map((p) => [p.id, p]))
  const nameOf = (id: string) => byId.get(id)?.name ?? '?'
  const personOf = (id: string) => byId.get(id) ?? fallbackPerson(nameOf(id))

  const rows = standings(matches)
  // Newest first, by sync creation time when present (played_at is day-only).
  const history = [...matches].sort((a, z) => (z.created_at ?? '').localeCompare(a.created_at ?? ''))

  const bothPicked = winnerId !== '' && loserId !== ''
  const canLog = bothPicked && winnerId !== loserId

  const log = () => {
    const id = crypto.randomUUID()
    const row: Match = {
      id, tournament_id: tournament.id, winner_id: winnerId, loser_id: loserId, played_at: todayISO(),
    }
    matches$[id].set(row)
    setWinnerId('')
    setLoserId('')
  }

  const th: CSSProperties = { textAlign: 'right', fontWeight: 700, fontSize: 13, padding: '4px 8px', opacity: 0.7 }
  const thLeft: CSSProperties = { ...th, textAlign: 'left' }
  const td: CSSProperties = { ...mono, textAlign: 'right', fontWeight: 700, fontSize: 16, padding: '8px' }
  const tdLeft: CSSProperties = { textAlign: 'left', padding: '8px' }

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <button type="button" onClick={onBack} className="back-chip">{`← ${t('common.back')}`}</button>
      </div>

      <h2 className="marker-underline" style={{ margin: '12px 0' }}>{t('tournaments.standings')}</h2>
      {rows.length === 0 ? (
        <p>{t('tournaments.noStandings')}</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thLeft}>{t('tournaments.player')}</th>
                <th style={th} title={t('tournaments.wins')}>{t('tournaments.w')}</th>
                <th style={th} title={t('tournaments.losses')}>{t('tournaments.l')}</th>
                <th style={th} title={t('tournaments.winRate')}>{t('tournaments.winPct')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const pct = Math.round((r.wins / (r.wins + r.losses)) * 100)
                return (
                  <tr key={r.personId} style={{ borderTop: '1px solid rgba(43,43,43,0.12)' }}>
                    <td style={tdLeft}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Badge person={personOf(r.personId)} size="sm" />
                        <span style={{ fontWeight: 700 }}>{nameOf(r.personId)}</span>
                        {i === 0 && (
                          <span role="img" aria-label={t('tournaments.leader')}>👑</span>
                        )}
                      </span>
                    </td>
                    <td style={td}>{r.wins}</td>
                    <td style={td}>{r.losses}</td>
                    <td style={td}>{`${pct}%`}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="marker-underline" style={{ margin: '24px 0 12px' }}>{t('tournaments.logGame')}</h2>
      {people.length < 2 ? (
        <p>{t('tournaments.needPeople')}</p>
      ) : (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <label>
              <span style={fieldLabel}>{t('tournaments.winner')}</span>
              <select value={winnerId} onChange={(e) => setWinnerId(e.target.value)} style={inputStyle}>
                <option value="">{t('tournaments.pickPerson')}</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>

            <label>
              <span style={fieldLabel}>{t('tournaments.loser')}</span>
              <select value={loserId} onChange={(e) => setLoserId(e.target.value)} style={inputStyle}>
                <option value="">{t('tournaments.pickPerson')}</option>
                {people.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>

            {bothPicked && winnerId === loserId && (
              <p style={{ color: 'var(--color-tomato-text)', fontWeight: 700, margin: 0 }}>
                {t('tournaments.mustDiffer')}
              </p>
            )}

            <button type="button" onClick={log} disabled={!canLog}
              style={{ ...primaryBtn, opacity: canLog ? 1 : 0.4 }}>
              {t('tournaments.logIt')}
            </button>
          </div>
        </Card>
      )}

      <h2 className="marker-underline" style={{ margin: '24px 0 12px' }}>{t('tournaments.history')}</h2>
      {history.length === 0 ? (
        <p>{t('tournaments.noStandings')}</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {history.map((m) => (
            <Card key={m.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <Badge person={personOf(m.winner_id)} size="sm" />
                <span style={{ fontWeight: 700 }}>{nameOf(m.winner_id)}</span>
                <span style={{ opacity: 0.7 }}>{t('tournaments.beat')}</span>
                <Badge person={personOf(m.loser_id)} size="sm" />
                <span style={{ fontWeight: 700 }}>{nameOf(m.loser_id)}</span>
                <button
                  type="button"
                  style={{ ...ghostBtn, color: 'var(--color-tomato-text)', marginLeft: 'auto' }}
                  onClick={() => {
                    if (pendingDelete === m.id) {
                      matches$[m.id].deleted.set(true)
                      setPendingDelete(null)
                    } else {
                      setPendingDelete(m.id)
                    }
                  }}
                >
                  {pendingDelete === m.id ? t('tournaments.tapAgain') : t('common.delete')}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
