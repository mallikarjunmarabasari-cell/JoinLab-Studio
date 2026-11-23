create table public.saved_sql_scripts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid()
    references auth.users (id) on delete cascade,
  name text not null
    check (char_length(btrim(name)) between 1 and 100),
  sql_text text not null
    check (char_length(sql_text) <= 100000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_sql_scripts_user_updated_idx
  on public.saved_sql_scripts (user_id, updated_at desc);

alter table public.saved_sql_scripts enable row level security;

revoke all on table public.saved_sql_scripts from public, anon, authenticated;

grant select, insert, update, delete
  on table public.saved_sql_scripts to authenticated;

create policy "Users can view their own saved SQL scripts"
  on public.saved_sql_scripts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can create their own saved SQL scripts"
  on public.saved_sql_scripts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can update their own saved SQL scripts"
  on public.saved_sql_scripts
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete their own saved SQL scripts"
  on public.saved_sql_scripts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.saved_sql_scripts is
  'Cloud-synced SQL editor scripts owned by individual authenticated users.';
