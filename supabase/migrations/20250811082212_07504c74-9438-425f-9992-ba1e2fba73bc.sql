-- Create user_events table for product analytics
create table if not exists public.user_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_name text not null,
  metadata jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- Enable Row Level Security
alter table public.user_events enable row level security;

-- Policies (idempotent)
drop policy if exists "Users can insert their own events" on public.user_events;
create policy "Users can insert their own events"
  on public.user_events
  for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can view their own events" on public.user_events;
create policy "Users can view their own events"
  on public.user_events
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all events" on public.user_events;
create policy "Admins can view all events"
  on public.user_events
  for select
  to authenticated
  using (is_admin(auth.uid()));

-- Helpful indexes
create index if not exists idx_user_events_user_id on public.user_events(user_id);
create index if not exists idx_user_events_occurred_at on public.user_events(occurred_at desc);
create index if not exists idx_user_events_event_name on public.user_events(event_name);