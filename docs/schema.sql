-- Chindrieux getaway — Supabase schema.
-- Paste this whole file into the Supabase SQL editor once, on a fresh project.
--
-- Sync model: legend-state syncs each table with a soft-delete trio
-- (created_at, updated_at, deleted) plus one moddatetime trigger per table
-- that bumps updated_at on every UPDATE.
--
-- RLS is intentionally OFF. The Supabase URL + anon key are the shared secret:
-- anyone with the app link is a trusted guest of the getaway. No per-user auth.

create extension if not exists moddatetime schema extensions;

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

-- One moddatetime trigger per table (bumps updated_at on UPDATE).
create trigger t_people before update on people
  for each row execute procedure moddatetime(updated_at);
create trigger t_expenses before update on expenses
  for each row execute procedure moddatetime(updated_at);
create trigger t_payments before update on payments
  for each row execute procedure moddatetime(updated_at);
create trigger t_tournaments before update on tournaments
  for each row execute procedure moddatetime(updated_at);
create trigger t_matches before update on matches
  for each row execute procedure moddatetime(updated_at);
create trigger t_oscar_categories before update on oscar_categories
  for each row execute procedure moddatetime(updated_at);
create trigger t_nominations before update on nominations
  for each row execute procedure moddatetime(updated_at);
create trigger t_votes before update on votes
  for each row execute procedure moddatetime(updated_at);
create trigger t_config before update on config
  for each row execute procedure moddatetime(updated_at);

-- Public storage bucket for expense receipts + oscar nomination photos.
insert into storage.buckets (id, name, public) values ('photos', 'photos', true);
