import { observable } from '@legendapp/state'
import type { Observable } from '@legendapp/state'
import { configureSynced } from '@legendapp/state/sync'
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { useSelector } from '@legendapp/state/react'
import { createClient } from '@supabase/supabase-js'
import type {
  Person,
  Expense,
  Payment,
  Tournament,
  Match,
  OscarCategory,
  Nomination,
  Vote,
  Config,
} from './domain/types'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

// syncedSupabase preconfigured with the shared sync trio + local-first persistence.
// Realtime is off for now (a getaway app tolerates a reload to see others' writes).
const synced = configureSynced(syncedSupabase, {
  supabase,
  generateId: () => crypto.randomUUID(),
  fieldCreatedAt: 'created_at',
  fieldUpdatedAt: 'updated_at',
  fieldDeleted: 'deleted',
  persist: { plugin: ObservablePersistLocalStorage, retrySync: true },
})

// Each table is an observable keyed by row id: Record<id, Row>.
const table = <T>(collection: string): Observable<Record<string, T>> =>
  observable<Record<string, T>>(
    synced({ collection, persist: { name: collection } }) as never,
  )

export const people$ = table<Person>('people')
export const expenses$ = table<Expense>('expenses')
export const payments$ = table<Payment>('payments')
export const tournaments$ = table<Tournament>('tournaments')
export const matches$ = table<Match>('matches')
export const oscarCategories$ = table<OscarCategory>('oscar_categories')
export const nominations$ = table<Nomination>('nominations')
export const votes$ = table<Vote>('votes')

// config is a keyed record too, with a single well-known row id 'main'.
export const config$ = table<Config>('config')

// Live array of non-deleted rows from a keyed table observable.
export const useRows = <T extends { deleted?: boolean }>(
  obs: Observable<Record<string, T>>,
): T[] =>
  useSelector(() => {
    const rows = (obs.get() ?? {}) as Record<string, T>
    return Object.values(rows).filter((r) => !r.deleted)
  })
