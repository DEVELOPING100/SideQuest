-- SideQuest initial database schema
-- Run this file in the Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  display_name text,
  created_at timestamptz not null default now()
);

create table if not exists public.adventures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  title text,
  location_name text not null,
  budget numeric(10, 2) check (budget is null or budget >= 0),
  time_minutes integer not null check (time_minutes > 0),
  group_size integer check (group_size is null or group_size > 0),
  vibe text,
  travel_mode text not null,
  interests text[] not null default '{}',
  total_estimated_minutes integer check (
    total_estimated_minutes is null or total_estimated_minutes > 0
  ),
  status text not null default 'planned' check (
    status in ('planned', 'active', 'completed', 'cancelled')
  ),
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.stops (
  id uuid primary key default gen_random_uuid(),
  adventure_id uuid not null references public.adventures(id) on delete cascade,
  external_place_id text,
  name text not null,
  category text,
  address text,
  estimated_minutes integer check (
    estimated_minutes is null or estimated_minutes > 0
  ),
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  stop_order integer not null check (stop_order > 0),
  distance_from_previous_meters integer check (
    distance_from_previous_meters is null or distance_from_previous_meters >= 0
  ),
  travel_minutes_from_previous integer check (
    travel_minutes_from_previous is null or travel_minutes_from_previous >= 0
  ),
  completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (adventure_id, stop_order)
);

create table if not exists public.stamps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  adventure_id uuid not null unique references public.adventures(id) on delete cascade,
  title text not null,
  stop_count integer not null check (stop_count > 0),
  earned_at timestamptz not null default now()
);

create index if not exists adventures_user_id_idx
  on public.adventures(user_id);

create index if not exists stops_adventure_id_idx
  on public.stops(adventure_id);

create index if not exists stamps_user_id_idx
  on public.stamps(user_id);

alter table public.users enable row level security;
alter table public.adventures enable row level security;
alter table public.stops enable row level security;
alter table public.stamps enable row level security;

-- Allow the server-only secret key to use these tables through the Data API.
-- No access is granted to the public anon or authenticated roles.
grant usage on schema public to service_role;
grant select, insert, update, delete on table public.users to service_role;
grant select, insert, update, delete on table public.adventures to service_role;
grant select, insert, update, delete on table public.stops to service_role;
grant select, insert, update, delete on table public.stamps to service_role;

-- No public RLS policies are created here. Add user policies later if
-- Supabase Auth is used directly by the frontend.

-- Adventure mode (ai or manual)
alter table adventures add column if not exists mode text not null default 'manual';
alter table stamps add column if not exists mode text not null default 'manual';
