# Chindrieux Getaway App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Dispatch implementation subagents with `model: "opus"`.

**Goal:** A shared-link, no-login webapp for a friends' getaway: Today (phase-aware home), Who's here (Gantt), Profiles, Costs (settle-up), Tournaments, Oscars, Wifi.

**Architecture:** Vite + React SPA. All shared state lives in legend-state observables synced to Supabase (localStorage persistence gives local-first + offline; Supabase gives the shared store). Domain logic (presence, settle-up, standings, phases) is pure functions in `src/domain/`, fully unit-tested; components stay thin. Hash-based navigation, no router library.

**Tech Stack:** pnpm, Vite, React 19, TypeScript (strict), Tailwind CSS v4, @legendapp/state (v3 + Supabase sync plugin), @supabase/supabase-js, qrcode, @fontsource/grandstander + @fontsource/nunito, Vitest. Deploy: Vercel.

## Global Constraints

- Package manager: **pnpm** only.
- Functional style: no classes, `for...of` over `forEach`.
- Allowed deps: exactly those in the Tech Stack line. Adding any other requires asking Rafa.
- Money: EUR only. Domain math in **integer cents**; DB stores numeric euros.
- Every UI string goes through the i18n dict with all four languages: **en, fr, pt, nl**. User-entered content is never translated.
- No em dashes in any copy, comments, or commit messages.
- Light theme only (sunny paper aesthetic, deliberate choice). Set `color-scheme: light`.
- Design tokens (from spec, direction A "Colonie de vacances"): cerulean `#4FA3D1`, sunny `#FFD23F`, tomato `#FF6B4A`, grass `#7BC950`, paper `#FBF6E9`, ink `#2B2B2B`. Display font Grandstander, body Nunito, mono for amounts/scores.
- Signature styling: cards "taped" to the page (washi-tape pseudo-element, slight rotation), avatars as enamel-pin badges (emoji in a colored ring), marker-underline headings.
- Trust model: anon key in the bundle, RLS off, the URL is the secret. Do not add auth.
- Accessibility floor: visible keyboard focus, `prefers-reduced-motion` respected, labels on inputs.
- Verification: unit tests for `src/domain/` and i18n; browser click-through (Playwright MCP) for screens.
- During implementation, fetch current legend-state v3 docs via context7 before writing sync code (the API is beta and moves); keep the intent of Task 2's code, adjust names only if docs differ.
- Skills per task: Task 2 loads `supabase:supabase` + `supabase:supabase-postgres-best-practices` (schema review) and may use the Supabase MCP instead of dashboard clicks; UI tasks (5-12) load `vercel-react-best-practices`; Task 13 loads `web-design-guidelines`, `verify`, and `vercel:deploy`.

## File Structure

```
chindrieux/
  docs/specs|plans/...
  index.html
  vite.config.ts, tsconfig.json, package.json
  .env.local (gitignored), .env.example
  src/
    main.tsx              app entry, fonts, css
    App.tsx               hash route -> screen
    nav.ts                useRoute() hash hook
    styles.css            tailwind @theme tokens + scrapbook signature classes
    i18n.ts               dict + useT() + lang$
    identity.ts           myId$ (localStorage-backed)
    store.ts              supabase client + synced observables per table
    photos.ts             uploadPhoto(file) -> public URL
    share.ts              waShare(text)
    domain/
      types.ts            row types + enums
      presence.ts         isPresentOn, presentOn, tripPhase, tripRange
      money.ts            balances, suggestTransfers, shares
      standings.ts        standings(matches)
      oscars.ts           tally(votes), winners
      *.test.ts           vitest per module
    components/
      Badge.tsx           enamel-pin avatar (emoji + color ring, 3 sizes)
      Card.tsx            taped scrapbook card
      PersonPicker.tsx    checklist of people (used by costs, matches)
      Screen.tsx          header + back-to-today shell
    screens/
      Today.tsx  Whoshere.tsx  Profiles.tsx  Onboarding.tsx
      Costs.tsx  Tournaments.tsx  Oscars.tsx  Wifi.tsx
```

---

### Task 1: Scaffold, tokens, nav shell

**Files:** Create the repo skeleton above minus screens' content: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/nav.ts`, `src/styles.css`, `.env.example`, `.gitignore`, seven stub screens rendering their name.

**Interfaces produced:** `useRoute(): string` (hash minus `#/`, `''` = Today); route names `''|'whoshere'|'profiles'|'costs'|'tournaments'|'oscars'|'wifi'|'onboarding'`; CSS classes `.card-taped`, `.badge-pin`, `.marker-underline`; Tailwind theme colors `cerulean|sunny|tomato|grass|paper|ink`.

- [ ] **Step 1: Scaffold**

```bash
cd ~/Developer/chindrieux
pnpm create vite . --template react-ts
pnpm add @legendapp/state@beta @supabase/supabase-js qrcode @fontsource/grandstander @fontsource/nunito
pnpm add -D tailwindcss @tailwindcss/vite vitest @types/qrcode
```

- [ ] **Step 2: Wire Tailwind v4 + tokens + fonts**

`vite.config.ts`: add `tailwindcss()` from `@tailwindcss/vite` to plugins. `src/styles.css`:

```css
@import "tailwindcss";
@theme {
  --color-cerulean: #4FA3D1; --color-sunny: #FFD23F; --color-tomato: #FF6B4A;
  --color-grass: #7BC950; --color-paper: #FBF6E9; --color-ink: #2B2B2B;
  --font-display: "Grandstander", cursive;
  --font-body: "Nunito", system-ui, sans-serif;
}
:root { color-scheme: light; }
body { background: var(--color-paper); color: var(--color-ink); font-family: var(--font-body); }
h1, h2, h3 { font-family: var(--font-display); }

.card-taped { position: relative; background: #fff; border-radius: 12px; padding: 16px;
  box-shadow: 0 6px 0 rgb(0 0 0 / .06); rotate: -1deg; }
.card-taped:nth-child(even) { rotate: 1deg; }
.card-taped::before { content: ""; position: absolute; top: -11px; left: 24px; width: 74px; height: 22px;
  background: repeating-linear-gradient(45deg, rgb(255 107 74 / .75) 0 8px, rgb(255 107 74 / .55) 8px 16px);
  rotate: -4deg; }
.badge-pin { border-radius: 9999px; display: grid; place-items: center; border: 3px solid #fff;
  box-shadow: 0 0 0 3px currentColor, 0 4px 8px rgb(0 0 0 / .15); }
.marker-underline { display: inline-block; }
.marker-underline::after { content: ""; display: block; height: 6px; margin-top: -4px;
  background: var(--color-sunny); border-radius: 4px; }
@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }
:focus-visible { outline: 3px solid var(--color-cerulean); outline-offset: 2px; }
```

`src/main.tsx` imports `@fontsource/grandstander/700.css`, `@fontsource/nunito/400.css`, `@fontsource/nunito/700.css`, `./styles.css`.

- [ ] **Step 3: Hash nav + stub screens**

```ts
// src/nav.ts
import { useEffect, useState } from 'react'
export function useRoute(): string {
  const [route, setRoute] = useState(() => location.hash.slice(2))
  useEffect(() => {
    const onHash = () => setRoute(location.hash.slice(2))
    addEventListener('hashchange', onHash)
    return () => removeEventListener('hashchange', onHash)
  }, [])
  return route
}
export const go = (r: string) => { location.hash = `#/${r}` }
```

`App.tsx`: switch on `useRoute()`, render the matching stub screen, default Today stub.

- [ ] **Step 4: Verify** `pnpm dev`, click hash links between stubs, all seven render. Fonts and paper background visible.

- [ ] **Step 5: Commit** `git add -A && git commit -m "feat: scaffold vite app with tokens and hash nav"`

---

### Task 2: Supabase schema + synced store

**Files:** Create `src/store.ts`, `src/domain/types.ts`, `src/identity.ts`, `src/photos.ts`, `docs/schema.sql`, `.env.local` (gitignored) + `.env.example`.

**Interfaces produced:**
- `people$, expenses$, payments$, tournaments$, matches$, oscarCategories$, nominations$, votes$, config$` : legend-state observables, each a `Record<id, Row>` (config$ is a single row, id `'main'`).
- `useRows<T>(obs): T[]` helper: live array of non-deleted rows.
- `myId$: Observable<string | null>` persisted to localStorage key `chindrieux.me`.
- `uploadPhoto(file: File): Promise<string>` returns public URL.
- Types from spec: `Person, Expense, Payment, Tournament, Match, OscarCategory, Nomination, Vote, Config, OscarsPhase ('proposing'|'voting'|'revealed'), Game ('pingpong'|'chess'|'foosball')`.

- [ ] **Step 1: One-time Supabase setup (Rafa, dashboard)** Create free project `chindrieux`. Run `docs/schema.sql` in the SQL editor. Create a **public** storage bucket `photos`. Copy URL + anon key into `.env.local` (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).

- [ ] **Step 2: Write `docs/schema.sql`**

Every table gets the sync trio (`created_at`, `updated_at`, `deleted`) legend-state uses for soft deletes, plus a moddatetime trigger. RLS stays off (URL is the secret).

```sql
create extension if not exists moddatetime;

create table people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_emoji text, avatar_color text,
  iban text,
  arrival date, departure date,
  blaze boolean, drink boolean, has_car boolean,
  world_cup_team text, mode int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create table expenses (
  id uuid primary key default gen_random_uuid(),
  payer_id uuid not null references people(id),
  amount numeric(8,2) not null,
  label text not null,
  date date not null,
  participant_ids uuid[] not null,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create table payments (
  id uuid primary key default gen_random_uuid(),
  from_id uuid not null references people(id),
  to_id uuid not null references people(id),
  amount numeric(8,2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create table tournaments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  game text not null check (game in ('pingpong','chess','foosball')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create table matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references tournaments(id),
  winner_id uuid not null references people(id),
  loser_id uuid not null references people(id),
  played_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create table oscar_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create table nominations (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references oscar_categories(id),
  title text not null,
  photo_url text,
  proposed_by uuid not null references people(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create table votes (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references oscar_categories(id),
  nomination_id uuid not null references nominations(id),
  voter_id uuid not null references people(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
create table config (
  id text primary key,
  wifi_ssid text, wifi_password text,
  oscars_phase text not null default 'proposing'
    check (oscars_phase in ('proposing','voting','revealed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted boolean not null default false
);
insert into config (id) values ('main');

-- one moddatetime trigger per table, e.g.:
create trigger t_people before update on people
  for each row execute procedure moddatetime(updated_at);
-- repeat for all tables
```

- [ ] **Step 3: `src/store.ts`** (verify exact option names against legend-state v3 docs via context7 first)

```ts
import { observable } from '@legendapp/state'
import { configureSynced } from '@legendapp/state/sync'
import { syncedSupabase } from '@legendapp/state/sync-plugins/supabase'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY)

const synced = configureSynced(syncedSupabase, {
  supabase,
  generateId: () => crypto.randomUUID(),
  fieldCreatedAt: 'created_at', fieldUpdatedAt: 'updated_at', fieldDeleted: 'deleted',
  persist: { plugin: ObservablePersistLocalStorage, retrySync: true },
})

const table = <T>(collection: string) =>
  observable<Record<string, T>>(synced({ collection, persist: { name: collection } }) as never)

export const people$ = table<Person>('people')
export const expenses$ = table<Expense>('expenses')
// ... one per table; config$ = observable(synced({ collection: 'config', persist: { name: 'config' } }))
```

`useRows`:

```ts
import { useSelector } from '@legendapp/state/react'
export const useRows = <T extends { deleted?: boolean }>(obs: Observable<Record<string, T>>): T[] =>
  useSelector(() => Object.values(obs.get() ?? {}).filter(r => !r.deleted))
```

- [ ] **Step 4: `src/identity.ts` + `src/photos.ts`** as sketched in File Structure (localStorage-synced `myId$`; `uploadPhoto` uploads to bucket `photos` under `crypto.randomUUID()` prefix and returns `getPublicUrl`).

- [ ] **Step 5: Verify** Temporary debug list on a stub screen: add a person via `people$[crypto.randomUUID()].set({...})`, see it appear in the Supabase table editor, reload, row survives, second browser tab sees it after reload. Remove debug code.

- [ ] **Step 6: Commit** `git commit -m "feat: supabase schema and legend-state synced store"`

---

### Task 3: Domain logic (TDD)

**Files:** Create `src/domain/presence.ts`, `money.ts`, `standings.ts`, `oscars.ts` + a `.test.ts` for each.

**Interfaces produced:**

```ts
// presence.ts (ISO yyyy-mm-dd strings compare lexicographically)
isPresentOn(p: Person, date: string): boolean           // arrival <= date <= departure
presentOn(people: Person[], date: string): Person[]
tripRange(people: Person[]): { start: string, end: string } | null   // min arrival, max departure
tripPhase(people: Person[], today: string): 'before' | 'during' | 'after'
daysUntil(today: string, start: string): number

// money.ts (all cents)
type Transfer = { from: string; to: string; amount: number }
shares(totalCents: number, participantIds: string[]): Map<string, number>  // even split, remainder cents to first participants, sums exactly to total
balances(expenses: Expense[], payments: Payment[]): Map<string, number>   // paid minus owed, net of payments; sums to zero
suggestTransfers(balances: Map<string, number>): Transfer[]               // greedy two-pointer, <= n-1 transfers

// standings.ts
standings(matches: Match[]): { personId: string; wins: number; losses: number }[]  // sorted wins desc, then win pct desc

// oscars.ts
tally(votes: Vote[], categoryId: string): Map<string, number>   // nominationId -> count
winners(votes: Vote[], nominations: Nomination[]): Map<string, string | null> // categoryId -> winning nominationId (ties: earliest nomination), null if no votes
```

- [ ] **Step 1: Write failing tests** covering at minimum:

```ts
// money.test.ts, the money path gets the real coverage
test('shares sum exactly to total with remainder cents', () => {
  const s = shares(1000, ['a', 'b', 'c'])
  expect([...s.values()].reduce((x, y) => x + y)).toBe(1000)
  expect([...s.values()].sort()).toEqual([333, 333, 334].sort())
})
test('balances sum to zero', ...)
test('payment reduces debt', ...)          // Marie owes 12, pays 12, balance flat
test('transfers settle everyone', () => {  // apply transfers to balances, all end 0
  const b = balances(fixtureExpenses, [])
  const t = suggestTransfers(b)
  for (const { from, to, amount } of t) { bump(b, from, amount); bump(b, to, -amount) }
  for (const v of b.values()) expect(v).toBe(0)
})
test('at most n-1 transfers', ...)
test('non-participant payer ends positive', ...)  // paid for others, owes nothing
```

Plus presence boundary tests (arrival day and departure day both count as present, missing dates mean not present), tripPhase before/during/after, standings ordering, oscars tie rule.

- [ ] **Step 2: Run, watch fail** `pnpm vitest run` fails with modules not found.

- [ ] **Step 3: Implement** `suggestTransfers` reference implementation:

```ts
export function suggestTransfers(b: Map<string, number>): Transfer[] {
  const owers = [...b].filter(([, v]) => v < 0).map(([id, v]) => ({ id, v })).sort((a, z) => a.v - z.v)
  const owed = [...b].filter(([, v]) => v > 0).map(([id, v]) => ({ id, v })).sort((a, z) => z.v - a.v)
  const out: Transfer[] = []
  let i = 0, j = 0
  while (i < owers.length && j < owed.length) {
    const x = Math.min(-owers[i].v, owed[j].v)
    if (x > 0) out.push({ from: owers[i].id, to: owed[j].id, amount: x })
    owers[i].v += x; owed[j].v -= x
    if (owers[i].v === 0) i++
    if (owed[j].v === 0) j++
  }
  return out
}
// ponytail: greedy, not provably minimal; everyone ends square, <= n-1 transfers
```

`balances`: for each expense add `Math.round(amount * 100)` to payer, subtract `shares(...)` from participants; then for each payment add to `from_id`, subtract from `to_id`.

- [ ] **Step 4: Run until green** `pnpm vitest run`, all pass.

- [ ] **Step 5: Commit** `git commit -m "feat: domain logic with tests (presence, money, standings, oscars)"`

---

### Task 4: i18n (en, fr, pt, nl)

**Files:** Create `src/i18n.ts`, `src/i18n.test.ts`, `src/components/LangSwitcher.tsx`.

**Interfaces produced:** `useT(): (key: string, vars?: Record<string, string | number>) => string`; `lang$: Observable<'en'|'fr'|'pt'|'nl'>` (localStorage-persisted, defaults from `navigator.language`, falls back `en`); `dict` keyed flat like `today.title`, `costs.addExpense`, `common.save`.

- [ ] **Step 1: Failing test** every key has all four languages:

```ts
test('dict is complete', () => {
  for (const [key, entry] of Object.entries(dict))
    for (const l of ['en', 'fr', 'pt', 'nl'] as const)
      expect(entry[l], `${key}.${l}`).toBeTruthy()
})
```

- [ ] **Step 2: Implement** flat dict + `{n}` interpolation, ~15 lines. Seed the keys each later task needs; every screen task adds its own keys (the completeness test enforces the four languages forever). `// ponytail: a flat object and a lookup, not an i18n framework`

- [ ] **Step 3: LangSwitcher** four small flag-emoji buttons (🇬🇧 🇫🇷 🇧🇷 🇳🇱), sets `lang$`. Lives on Today + onboarding.

- [ ] **Step 4: Test green, commit** `git commit -m "feat: four-language i18n dict and switcher"`

---

### Task 5: Identity + onboarding

**Files:** Create `src/screens/Onboarding.tsx`, `src/components/Badge.tsx`, `src/components/Card.tsx`, `src/avatars.ts`. Modify `App.tsx` (if `myId$` empty, show Onboarding regardless of route).

**Interfaces produced:** `Badge({ person, size: 'sm'|'md'|'lg' })` renders emoji in colored ring; `src/avatars.ts` exports `EMOJIS: string[]` (~40 curated: animals, faces, food, sport) and `COLORS: string[]` (the 6 palette colors); onboarding writes a complete `Person` row and sets `myId$`.

- [ ] **Step 1: Build flow** Three steps in one component, no wizard lib:
  1. "Who are you?" list of existing people as Badge buttons (taken names show greyed with "that's me" still tappable), plus "+ I'm new" name input.
  2. Badge builder: emoji grid + color dots, live Badge preview at `lg`.
  3. Dates + vibes: two native `<input type="date">` (arrival, departure), toggles for blaze/drink/has_car, text input for world cup team, `<input type="range" min="0" max="100">` for work vs chill. Every field skippable. No IBAN here (close-up collects it).
  Save: `people$[id].set(row)` (new) or `.assign(partial)` (existing), `myId$.set(id)`, `go('')`.

- [ ] **Step 2: Verify in browser** Fresh profile (incognito) lands on onboarding, creates person, reload skips straight to Today stub, row visible in Supabase.

- [ ] **Step 3: Commit** `git commit -m "feat: onboarding with badge builder and localStorage identity"`

---

### Task 6: Profiles roster

**Files:** Create `src/screens/Profiles.tsx`, `src/components/Screen.tsx` (shared shell: marker-underline h1, back-to-today link).

- [ ] **Step 1: Build** Grid of Badges + names. Tap opens a taped card: vibes (🌿 blaze, 🍺 drink, 🚗 car, ⚽ team, work↔chill bar), arrival/departure. If it's me: "edit my profile" reopens onboarding steps prefilled. "+ Add person" opens onboarding step 1's name input flow but does NOT set `myId$` (adding someone else, doubles as invite).
- [ ] **Step 2: Verify in browser**, both self-edit and add-other paths.
- [ ] **Step 3: Commit** `git commit -m "feat: profiles roster with badges and add person"`

---

### Task 7: Who's here (Gantt)

**Files:** Create `src/screens/Whoshere.tsx`.

- [ ] **Step 1: Build** From `tripRange(people)` build `days: string[]`. CSS grid: `gridTemplateColumns: '80px repeat(${days.length}, 1fr)'`. Header row: weekday initial + day number. Per person one row: name cell, then a bar spanning `gridColumn: ${2 + idx(arrival)} / ${3 + idx(departure)}` with `background: person.avatar_color`, rounded, Badge sm at bar start. People without dates listed below with a "set your dates" nudge (native date inputs inline, writes `people$[id].assign(...)`). Today column gets a sunny highlight. Horizontal scroll container for long trips. `// ponytail: CSS grid, not a calendar lib`
- [ ] **Step 2: Verify** with 4+ seeded people at staggered dates; overlap reads at a glance.
- [ ] **Step 3: Commit** `git commit -m "feat: who's here gantt timeline"`

---

### Task 8: Costs + settle up

**Files:** Create `src/screens/Costs.tsx`, `src/components/PersonPicker.tsx`.

**Interfaces consumed:** `presentOn`, `balances`, `suggestTransfers`, `useRows`, `uploadPhoto`.

- [ ] **Step 1: Expense list + form** Taped cards: label, payer Badge, amount (mono), participant Badges, optional photo thumbnail. Form: label, amount (`<input type="number" step="0.01">`), date (default today), payer (default me), PersonPicker checklist **pre-checked from `presentOn(people, date)`** and re-derived when date changes (manual unchecks preserved per open form only), optional `<input type="file" accept="image/*">` via `uploadPhoto`. Edit and delete (`expenses$[id].deleted.set(true)`) on every card, no confirmation beyond one tap-again.
- [ ] **Step 2: Settle up section** `const t = suggestTransfers(balances(expenses, payments))`. Each line: `from Badge → to Badge  €xx.xx`, payee IBAN shown beneath if set. If **my** balance is positive and my IBAN is empty: inline prompt "add your IBAN so friends can pay you" writing to `people$[myId].iban`. "Mark paid" button inserts a `payments` row for that exact amount; line disappears because balances recompute net of payments. Settled payments listed small underneath ("Marie paid Tom €12 ✓").
- [ ] **Step 3: Verify** the full loop in browser: 3 expenses, uneven attendance, settle-up lines match hand-checked math, mark paid clears a line, new expense reopens correctly.
- [ ] **Step 4: Commit** `git commit -m "feat: costs with attendance-aware split and settle up"`

---

### Task 9: Tournaments

**Files:** Create `src/screens/Tournaments.tsx`.

- [ ] **Step 1: Build** List of tournament cards (name + game emoji 🏓 ♟️ ⚽). "New tournament" inline form: name + game select. Inside a tournament: standings table from `standings(matches)` (Badge, W, L, win%, mono numbers, leader gets 👑), "log a game" form (winner picker, loser picker, must differ), match history list with delete.
- [ ] **Step 2: Verify** log 5 matches across 2 tournaments, standings order correct, delete recomputes.
- [ ] **Step 3: Commit** `git commit -m "feat: tournaments with match log and standings"`

---

### Task 10: Oscars

**Files:** Create `src/screens/Oscars.tsx`.

**Interfaces consumed:** `config$.oscars_phase`, `tally`, `winners`, `uploadPhoto`.

- [ ] **Step 1: Build the three phases** driven by `config$.oscars_phase.get()`:
  - **proposing:** categories as taped cards; "+ category" inline form; under each, nominations (title + optional photo + proposer Badge) and "propose a moment" form. Anyone can add either.
  - **voting:** per category, nominations as big tappable cards; tapping votes (upsert: one vote per voter per category, replace on re-tap). "You voted ✓" state. Own nominations votable (trust the group).
  - **revealed:** ceremony mode, big typography for the TV: category name, 🏆 winning nomination + photo + vote count, one category per viewport section, scroll to advance. Ties: earliest nomination wins (domain rule). This screen alone goes dark by design (velvet-dark ground, spotlight on the winner, gold accents): award ceremonies happen in dark rooms; it is theater, not a theme. The rest of the app stays light.
  - Phase control: a small footer row of three buttons (propose/vote/reveal) setting `config$.oscars_phase`, visible to everyone. `// ponytail: no host role, trust the group`
- [ ] **Step 2: Verify** full ceremony flow with two browsers voting.
- [ ] **Step 3: Commit** `git commit -m "feat: oscars propose, vote, and ceremony reveal"`

---

### Task 11: Wifi

**Files:** Create `src/screens/Wifi.tsx`.

- [ ] **Step 1: Build** If `config$.wifi_ssid` empty: form for SSID + password writing to `config$`. Else: big card with SSID, password (tap to copy via `navigator.clipboard.writeText`), and QR from `qrcode`:

```ts
import QRCode from 'qrcode'
const esc = (s: string) => s.replace(/([\\;,:"'])/g, '\\$1')
const dataUrl = await QRCode.toDataURL(`WIFI:T:WPA;S:${esc(ssid)};P:${esc(pass)};;`, { width: 240, margin: 1 })
```

  "Edit" reopens the form.
- [ ] **Step 2: Verify** scan the QR with a real phone camera, it offers to join.
- [ ] **Step 3: Commit** `git commit -m "feat: wifi screen with join qr"`

---

### Task 12: Today (phase-aware home)

**Files:** Create `src/screens/Today.tsx`, `src/share.ts`. Modify `App.tsx` default route.

**Interfaces consumed:** `tripPhase`, `tripRange`, `daysUntil`, `presentOn`, `standings`, `config$.oscars_phase`, `suggestTransfers`.

- [ ] **Step 1: Build** Header: app title in marker font, LangSwitcher, my Badge (tap = my profile). Card stack by `tripPhase(people, todayISO)`:
  - **before:** countdown card ("{n} days to go ☀️", from `daysUntil`), roster-so-far Badge row + "who's still missing a badge/dates" nudge, share-the-link button via `share.ts` (`https://wa.me/?text=` + encoded app URL + invite line).
  - **during:** "arriving today / leaving today" (Badge rows from arrival/departure equal to today), "here now" Badge row (`presentOn`), one-tap "add expense" (goes to `#/costs` with form open via hash `#/costs?new`), current tournament leader line ("🏓 Tom leads"), oscars nudge matching phase ("propose a moment" / "vote now!"), small wifi shortcut card.
  - **after:** "that's a wrap 🎬" card, settle-up summary (transfer count + my line if any) linking to costs, oscars ceremony link if revealed, share-a-recap button.
  - Below the stack always: the six navigation sticker-cards (grid, one per screen, emoji + label).
- [ ] **Step 2: Verify** all three states by temporarily overriding today's date (dev-only query param `?fakeToday=2026-08-14` read in one place: `const todayISO = new URLSearchParams(location.search).get('fakeToday') ?? new Date().toISOString().slice(0, 10)` in a `today.ts` helper used everywhere).
- [ ] **Step 3: Commit** `git commit -m "feat: phase-aware today home screen"`

---

### Task 13: Polish, verify, deploy

**Files:** Touch-ups across screens; `vercel.json` not needed (static SPA).

- [ ] **Step 1: A11y + design pass** Run web-design-guidelines review: focus states, labels, contrast on sunny/tomato, tap targets 44px, `text-wrap: balance` on headings. Fix findings.
- [ ] **Step 2: i18n sweep** grep screens for raw strings outside `useT`; dict completeness test still green. `pnpm vitest run` green.
- [ ] **Step 3: End-to-end click-through** (verify skill + Playwright MCP): fresh incognito onboarding → set dates → add expense → log match → propose + vote + reveal oscars → settle up + mark paid → wifi QR. Two parallel sessions to confirm shared state.
- [ ] **Step 4: Deploy** `pnpm build`, deploy to Vercel (vercel:deploy skill), set the two `VITE_SUPABASE_*` env vars in the Vercel project. Open the production URL on a phone, run onboarding.
- [ ] **Step 5: Commit + tag** `git commit -m "chore: polish pass and production deploy" && git tag v1`

---

## Self-review notes

- Spec coverage checked: all seven screens, onboarding, IBAN-at-close-up, payments-not-settlements, nominations, phase flags, countdown, wa.me share, add-person-as-invite, edit/delete, remember-me, EUR-only, no-dark-mode all have a home in a task.
- Deliberate deltas from spec: none remaining (spec was updated for `payments` and `nominations` before this plan was committed).
- Type names in Tasks 5-12 match Task 2/3 interfaces (checked: `presentOn`, `suggestTransfers`, `balances`, `standings`, `tripPhase`, `useRows`, `myId$`, `config$.oscars_phase`).
