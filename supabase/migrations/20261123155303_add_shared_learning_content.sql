create table public.learning_datasets (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null
    check (char_length(btrim(name)) between 1 and 120),
  description text not null default '',
  dataset_sql text not null
    check (char_length(dataset_sql) between 1 and 500000),
  expected_tables text[] not null default '{}',
  version integer not null default 1 check (version > 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sql_challenges (
  id uuid primary key default gen_random_uuid(),
  dataset_id uuid not null
    references public.learning_datasets(id) on delete cascade,
  slug text not null
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text not null
    check (char_length(btrim(title)) between 1 and 160),
  prompt text not null
    check (char_length(btrim(prompt)) between 1 and 5000),
  topic text not null
    check (char_length(btrim(topic)) between 1 and 80),
  difficulty text not null
    check (difficulty in ('easy', 'medium', 'hard')),
  starter_sql text not null default '',
  hints text[] not null default '{}',
  points integer not null default 10
    check (points between 1 and 1000),
  sort_order integer not null check (sort_order > 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (dataset_id, slug),
  unique (dataset_id, sort_order)
);

create table public.user_challenge_progress (
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  challenge_id uuid not null
    references public.sql_challenges(id) on delete cascade,
  dataset_version integer not null check (dataset_version > 0),
  status text not null
    check (status in ('in_progress', 'completed')),
  attempts integer not null default 0 check (attempts >= 0),
  first_started_at timestamptz not null default now(),
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, challenge_id, dataset_version),
  check (
    (status = 'completed' and completed_at is not null)
    or (status = 'in_progress' and completed_at is null)
  )
);

create index sql_challenges_published_order_idx
  on public.sql_challenges (dataset_id, sort_order)
  where is_published = true;

create index user_challenge_progress_user_updated_idx
  on public.user_challenge_progress (user_id, updated_at desc);

alter table public.learning_datasets enable row level security;
alter table public.sql_challenges enable row level security;
alter table public.user_challenge_progress enable row level security;

revoke all on table public.learning_datasets from public, anon, authenticated;
revoke all on table public.sql_challenges from public, anon, authenticated;
revoke all on table public.user_challenge_progress from public, anon, authenticated;

grant select on table public.learning_datasets to authenticated;
grant select on table public.sql_challenges to authenticated;
grant select, insert, update, delete
  on table public.user_challenge_progress to authenticated;

create policy "Authenticated users can read published datasets"
  on public.learning_datasets
  for select to authenticated
  using (is_published = true);

create policy "Authenticated users can read published challenges"
  on public.sql_challenges
  for select to authenticated
  using (
    is_published = true
    and exists (
      select 1
      from public.learning_datasets d
      where d.id = dataset_id
        and d.is_published = true
    )
  );

create policy "Users can read their own challenge progress"
  on public.user_challenge_progress
  for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own challenge progress"
  on public.user_challenge_progress
  for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1
      from public.sql_challenges c
      join public.learning_datasets d on d.id = c.dataset_id
      where c.id = challenge_id
        and c.is_published = true
        and d.is_published = true
        and d.version = dataset_version
    )
  );

create policy "Users can update their own challenge progress"
  on public.user_challenge_progress
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own challenge progress"
  on public.user_challenge_progress
  for delete to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.learning_datasets is
  'Administrator-managed SQL dataset definitions; learners can read published versions only.';

comment on table public.sql_challenges is
  'Administrator-managed ordered SQL challenges; challenge solutions are not stored in this learner-readable table.';

comment on table public.user_challenge_progress is
  'Private per-user SQL challenge progress, scoped to a published dataset version.';
