-- Voicley early-access signups (site upgrade: mailto -> real table).
-- Run once in the Supabase SQL editor. The site then POSTs with the
-- PUBLISHABLE key only; RLS makes the table write-only for anonymous
-- visitors (they can never read the list).

create table if not exists public.site_signups (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  platform text default '',
  created_at timestamptz not null default now()
);

alter table public.site_signups enable row level security;

-- Anyone may ADD themselves...
create policy "anon can sign up"
  on public.site_signups for insert
  to anon
  with check (true);

-- ...nobody anonymous may read/change/delete the list.
-- (No select/update/delete policies for anon = denied by default.)
