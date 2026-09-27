-- SideQuest demo data
-- Safe to run more than once: fixed IDs prevent duplicate records.

begin;

insert into public.users (id, display_name)
values (
  '11111111-1111-4111-8111-111111111111',
  'Demo Explorer'
)
on conflict (id) do nothing;

insert into public.adventures (
  id,
  user_id,
  title,
  location_name,
  budget,
  time_minutes,
  group_size,
  vibe,
  travel_mode,
  interests,
  total_estimated_minutes,
  status,
  completed_at
)
values (
  '22222222-2222-4222-8222-222222222222',
  '11111111-1111-4111-8111-111111111111',
  'Fredericton Explorer',
  'Fredericton, NB',
  40.00,
  120,
  2,
  'relaxed',
  'walking',
  array['food', 'nature', 'art'],
  105,
  'completed',
  now()
)
on conflict (id) do nothing;

insert into public.stops (
  id,
  adventure_id,
  external_place_id,
  name,
  category,
  address,
  estimated_minutes,
  latitude,
  longitude,
  stop_order,
  distance_from_previous_meters,
  travel_minutes_from_previous,
  completed,
  completed_at
)
values
  (
    '33333333-3333-4333-8333-333333333331',
    '22222222-2222-4222-8222-222222222222',
    'demo-riverfront-trail',
    'Riverfront Trail',
    'nature',
    'Fredericton, NB',
    30,
    45.9636,
    -66.6431,
    1,
    0,
    0,
    true,
    now()
  ),
  (
    '33333333-3333-4333-8333-333333333332',
    '22222222-2222-4222-8222-222222222222',
    'demo-local-cafe',
    'Local Cafe',
    'food',
    'Fredericton, NB',
    30,
    45.9648,
    -66.6419,
    2,
    450,
    6,
    true,
    now()
  ),
  (
    '33333333-3333-4333-8333-333333333333',
    '22222222-2222-4222-8222-222222222222',
    'demo-mural-wall',
    'Hidden Mural Wall',
    'art',
    'Fredericton, NB',
    20,
    45.9655,
    -66.6410,
    3,
    300,
    4,
    true,
    now()
  )
on conflict (id) do nothing;

insert into public.stamps (
  id,
  user_id,
  adventure_id,
  title,
  stop_count
)
values (
  '44444444-4444-4444-8444-444444444444',
  '11111111-1111-4111-8111-111111111111',
  '22222222-2222-4222-8222-222222222222',
  'Fredericton Explorer',
  3
)
on conflict (id) do nothing;

commit;
