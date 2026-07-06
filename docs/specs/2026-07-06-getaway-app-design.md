# Chindrieux Getaway App

A small shared web app for a friends' getaway in Chindrieux. One link, no login,
one shared store. Fun surface, one genuinely useful core (attendance-aware cost
splitting + carpool).

## Access model

One shared URL dropped in the group chat. Open it, pick your name, you're in.
No accounts, no passwords, no email. The link is the secret. Trust the group.

The roster is open-ended: anyone can tap **"+ Add person"** to create a new
entry (name, then optionally avatar / IBAN / arrival-departure / vibe). That new
name appears in the pick-your-name list, so adding a person doubles as inviting
them. Someone adds you, or you add yourself. No invite/email flow.

## Screens

1. **Who's here** — a horizontal bar timeline (mini Gantt): days across the top,
   one row per person, a colored bar spanning their stay, so overlap reads at a
   glance (carpool, who's around which night). Entry via native `<input
   type="date">`. Editable by anyone. `// ponytail:` CSS grid, not a calendar lib.
2. **Profiles** — a roster grid of avatars. Tap a face to see their vibe.
3. **Costs** — add an expense, flat split among whoever was present that day,
   settle up via shown IBANs. Optional receipt photo attached as a memo.
4. **Tournaments** — log matches, standings compute themselves.
5. **Oscars** — vote best moments at the end, reveal winners.
6. **Wifi** — SSID + password + a join-QR everyone points their camera at.

Sharing / notifications use `wa.me` deep links (pre-filled WhatsApp messages the
user taps to send). No WhatsApp API integration.

## Data (Supabase, no auth, RLS off, URL is the secret)

- **people**: name, avatar_emoji, avatar_color, iban, arrival (date),
  departure (date), blaze (bool), drink (bool), world_cup_team (text),
  has_car (bool), mode (int 0–100, work↔chill slider)
- **tournaments**: name, game (pingpong | chess | foosball)
- **matches**: tournament (ref), winner (person), loser (person), played_at
- **expenses**: payer (person), amount, label, date, participants (person list),
  photo_url (nullable)
- **settlements**: from (person), to (person), amount, settled (bool)
- **oscar_categories**: name
- **votes**: category (ref), nominee (text), voter (person)
- **config**: single row — wifi_ssid, wifi_password, oscars_phase
  (proposing | voting | revealed)

No `taches` table (chores dropped). No expense line-items (costs kept flat).
Currency is EUR everywhere — no currency field.

## Feature detail

**Profiles / avatars.** Avatar = pick an emoji + a background color. Zero
dependencies, no image upload, no avatar builder. Fun fields: blaze, drink,
World Cup team, has_car (carpool from the station), work↔chill slider.
`// ponytail:` emoji+color avatar; DiceBear drops in later if fancier is ever wanted.

**Costs.** Add expense: payer, amount, label, and a "who's in on this" checklist
that **pre-checks whoever was present that day** (from arrival/departure). Uncheck
anyone who skipped. Optionally attach a receipt photo (stored as a memo, not
parsed). "Settle up" view computes minimal transfers ("Marie owes Tom 40€") and
shows the payee's IBAN under each line. IBANs are collected **only at close-up**:
when settle-up opens, each creditor (someone owed money) is prompted to add their
IBAN once; it then appears under their transfer lines. Debtors never enter one.
Each transfer line has a **"mark settled"** toggle (a `settlements` row) so it
clears once the bank transfer lands. No money
moves through the app. Split is flat "everyone present that day," edit per
expense. No line-item tagging, no nights-stayed weighting.

*Settle-up algorithm (greedy net-and-match):* for each person, balance = paid −
share-owed (balances sum to zero). Repeatedly transfer `min(biggest ower, biggest
owed)` between the two extremes, drop whoever hits ~0, repeat. Yields ≤ (people−1)
transfers. `// ponytail:` greedy, not provably-minimal (true minimum is NP-hard);
nobody cares whether it's 4 transfers or 3. Ships with one self-check: balances
sum to zero in, everyone flat out.

**Wifi.** A config screen: SSID + password, plus a join-QR (`WIFI:S:...;P:...;;`
format) any phone camera joins by pointing at it. QR is a tiny data-URI generator,
no service.

**Sharing.** "Share app link" and "ping the group" open WhatsApp via a
`wa.me/?text=...` deep link with the message pre-filled; the user taps send. No
WhatsApp Business API, no bot, no number.

**Tournaments.** Pick game, log a match (winner + loser). Standings derive
themselves (W / L / win %). `// ponytail:` match log + derived standings only —
no brackets, no seeding, no elimination trees. Add brackets only if someone runs
a formal knockout.

**Oscars.** Add categories (Best Moment, Biggest Fail, Chef of the Week).
Everyone votes at the end. Results screen reveals winners. Pure fun.

## Primary flows

**Onboarding / build your profile.** Land on link → "Who are you?" → tap your
name, or "+ I'm new" → build your card (emoji + color avatar with live badge
preview, arrival/departure, vibe toggles) → you're in. `localStorage`
remembers you so you never re-pick. No IBAN here — that's collected at close-up.

**Tournaments / finish a game.** Open a tournament → "Who won? / Who lost?" →
save. Standings recompute. Creating a tournament is a tiny host form.

**Oscars / propose → vote → present.** Anyone proposes moments (optional photo)
while `oscars_phase = proposing`. Host flips to `voting` (one vote per person per
category), then to `revealed` — a ceremony screen to project on the TV. Oscar
categories are a tiny host form.

## Also in scope

- **Edit / delete** on expenses, matches, people (reuses the create forms).
- **Remember me** — `localStorage` keeps you signed in after first pick.
- **Today (home)** — a phase-aware front door, not a static menu. It reads the
  date against the arrival/departure timeline and `oscars_phase` and shows the
  right card stack:
  - *Before the trip*: countdown ("6 days to go ☀️"), roster filling up, "build
    your badge / set your dates" nudge.
  - *During*: who arrives/leaves today, who's here now, one-tap add expense, live
    tournament + oscars nudges, quick wifi.
  - *Close-up*: settle-up front and center, oscars ceremony, wrap.

  Nav to the six detail screens lives underneath. `// ponytail:` Today and Home
  are one screen, three derived states, no new tables. No weather (external API).
- **Config via tiny in-app forms** (decision A) — create tournament, add oscar
  category, set wifi. No separate admin app, no MCP server.

## Privacy (conscious accept)

Anyone with the link can read/edit everything. IBANs are the only sensitive data,
and they only exist at close-up (collected from creditors at settle-up, never
during onboarding) — so there's no financial data sitting around for most of the
trip's life. Fine for a trusted group who'd share IBANs to settle up anyway.
Delete the Supabase project after the trip.

## Look & feel — "Colonie de vacances" (scrapbook)

Warm, hand-made, childish-cute. A summer-camp scrapbook, not French-themed —
the group is international.

- **Palette**: cerulean `#4FA3D1` · sunny `#FFD23F` · tomato `#FF6B4A` ·
  grass `#7BC950` · cream paper `#FBF6E9` · ink `#2B2B2B`
- **Type**: chunky marker display (Grandstander / Chewy) + rounded body (Nunito)
  + mono for scores/amounts
- **Signature**: cards taped onto the page with washi tape; avatars are
  enamel-pin sticker badges; marker-underline headings; a slightly wonky grid.
- Light-committed (no dark mode — it's a sunny paper aesthetic).

## Languages

UI is multilingual: **English · French · Portuguese · Dutch**. A language
switcher; default to the browser language, fall back to English. Only the UI
chrome is translated — user-entered content (names, expense labels, oscar
categories) stays as typed.

`// ponytail:` a flat key→{en,fr,pt,nl} dictionary + a tiny lookup, not a full
i18n framework. The string set is small.

## Tech

- Single-page app, built with Fable
- Supabase for the shared store (free tier, no login, RLS off)
- One deploy, one link

## Deliberately skipped (add only if the weekend proves you need it)

Accounts, payments, Excel import, tâches/chores board, push notifications,
real-time cursors, native mobile app, tournament brackets, nights-stayed cost
weighting, receipt itemization / AI parsing, WhatsApp API integration.
