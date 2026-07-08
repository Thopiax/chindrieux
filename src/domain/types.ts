export type Game = 'pingpong' | 'chess' | 'foosball'
export type OscarsPhase = 'proposing' | 'voting' | 'revealed'

type SyncFields = { created_at?: string; updated_at?: string; deleted?: boolean }

export type Person = SyncFields & {
  id: string; name: string
  avatar_emoji: string | null; avatar_color: string | null
  iban: string | null
  arrival: string | null; departure: string | null
  blaze: boolean | null; drink: boolean | null; has_car: boolean | null
  world_cup_team: string | null; mode: number | null
  // Optional (not `| null` on a required key) so pre-migration rows and the
  // fallbackPerson literals stay valid. Absent/null means "eats meat".
  eats_meat?: boolean | null
}
export type Expense = SyncFields & {
  id: string; payer_id: string; amount: number; label: string; date: string
  participant_ids: string[]; photo_url: string | null
  // When set (and after `date`), the expense covers [date, end_date] and splits
  // by days present in that range instead of evenly.
  end_date?: string | null
}
export type Payment = SyncFields & { id: string; from_id: string; to_id: string; amount: number }
export type Tournament = SyncFields & { id: string; name: string; game: Game }
export type Match = SyncFields & {
  id: string; tournament_id: string; winner_id: string; loser_id: string; played_at: string
}
export type OscarCategory = SyncFields & { id: string; name: string }
export type Nomination = SyncFields & {
  id: string; category_id: string; title: string; photo_url: string | null; proposed_by: string
}
export type Vote = SyncFields & {
  id: string; category_id: string; nomination_id: string; voter_id: string
}
export type Config = SyncFields & {
  id: string; wifi_ssid: string | null; wifi_password: string | null; oscars_phase: OscarsPhase
}
