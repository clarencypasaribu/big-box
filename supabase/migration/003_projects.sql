-- Recreate projects table with UUID primary key and common columns
drop table if exists public.projects cascade;

create table public.projects (
  uuid         uuid primary key default gen_random_uuid(),
  code         text unique,
  name         text not null,
  location     text,
  status       text not null default 'In Progress'
               check (status in ('In Progress','Completed','Not Started','Pending')),
  progress     integer not null default 0,
  lead         text,
  icon_bg      text,
  description  text,
  start_date   date,
  end_date     date,
  team_members text[],
  owner_id     uuid references auth.users(id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

-- RLS: allow service_role or owner to read/update/delete/insert
alter table public.projects enable row level security;

drop policy if exists projects_select_owner on public.projects;
create policy projects_select_owner
on public.projects
for select
using (auth.role() = 'service_role' or auth.uid() = owner_id);

drop policy if exists projects_insert_owner on public.projects;
create policy projects_insert_owner
on public.projects
for insert
with check (auth.role() = 'service_role' or auth.uid() = owner_id);

drop policy if exists projects_update_owner on public.projects;
create policy projects_update_owner
on public.projects
for update
using (auth.role() = 'service_role' or auth.uid() = owner_id);

drop policy if exists projects_delete_owner on public.projects;
create policy projects_delete_owner
on public.projects
for delete
using (auth.role() = 'service_role' or auth.uid() = owner_id);
