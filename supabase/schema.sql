create extension if not exists pgcrypto;

do $$
begin
  if not exists (
    select 1
    from pg_type
    where typname = 'submission_status'
  ) then
    create type public.submission_status as enum ('new', 'in_review', 'resolved');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create table if not exists public.submissions (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  client_code text not null,
  phone text,
  email text,
  status public.submission_status not null default 'new',
  notes text,
  files_count integer not null default 0 check (files_count between 0 and 10),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  file_name text not null,
  storage_bucket text not null,
  storage_path text not null,
  content_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  sort_order integer not null default 0,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists submissions_created_at_idx
  on public.submissions (created_at desc);

create index if not exists submissions_status_idx
  on public.submissions (status, created_at desc);

create index if not exists submission_files_submission_id_idx
  on public.submission_files (submission_id, sort_order);

drop trigger if exists set_submissions_updated_at on public.submissions;

create trigger set_submissions_updated_at
before update on public.submissions
for each row
execute function public.set_updated_at();

alter table public.submissions enable row level security;
alter table public.submission_files enable row level security;

revoke all on public.submissions from anon, authenticated;
revoke all on public.submission_files from anon, authenticated;
