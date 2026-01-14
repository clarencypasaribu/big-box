-- Projects table definition
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text unique,
  location text,
  status text default 'In Progress',
  progress integer default 0 check (progress between 0 and 100),
  lead text,
  icon_bg text,
  description text,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- keep updated_at current
create or replace function public.handle_projects_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_projects_updated_at on public.projects;
create trigger trg_projects_updated_at
before update on public.projects
for each row execute function public.handle_projects_updated_at();

-- row level security
alter table public.projects enable row level security;

drop policy if exists projects_select_own on public.projects;
create policy projects_select_own
on public.projects for select
using (auth.role() = 'authenticated');

drop policy if exists projects_insert_owner on public.projects;
create policy projects_insert_owner
on public.projects for insert
with check (auth.uid() = owner_id);

drop policy if exists projects_update_owner on public.projects;
create policy projects_update_owner
on public.projects for update
using (auth.uid() = owner_id);
