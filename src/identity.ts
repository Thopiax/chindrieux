import { observable } from '@legendapp/state'
import { synced } from '@legendapp/state/sync'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'

// Who am I on this device? Persisted locally under the key `chindrieux.me`.
// Null until the guest picks their person during onboarding.
export const myId$ = observable<string | null>(
  synced<string | null>({
    initial: null,
    persist: { name: 'chindrieux.me', plugin: ObservablePersistLocalStorage },
  }) as never,
)
