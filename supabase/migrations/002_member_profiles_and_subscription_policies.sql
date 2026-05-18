create extension if not exists pgcrypto;

create table if not exists public.member_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  login_id text not null unique,
  pin_hash text not null,
  must_change_pin boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint member_profiles_login_id_4digits check (login_id ~ '^\d{4}$')
);

alter table public.member_profiles enable row level security;

drop policy if exists "Users can read own member profile" on public.member_profiles;
create policy "Users can read own member profile"
  on public.member_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "Users can update own member profile" on public.member_profiles;
create policy "Users can update own member profile"
  on public.member_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own subscription" on public.subscriptions;
create policy "Users can update own subscription"
  on public.subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create or replace function public.generate_login_id()
returns text
language plpgsql
as $$
declare
  candidate text;
begin
  loop
    candidate := lpad((floor(random() * 10000))::int::text, 4, '0');
    exit when not exists (
      select 1 from public.member_profiles where login_id = candidate
    );
  end loop;
  return candidate;
end;
$$;

create or replace function public.hash_pin(pin text)
returns text
language sql
immutable
as $$
  select encode(extensions.digest(pin, 'sha256'), 'hex');
$$;

create or replace function public.create_member_assets()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.member_profiles (
    user_id,
    email,
    login_id,
    pin_hash,
    must_change_pin
  ) values (
    new.id,
    coalesce(new.email, ''),
    public.generate_login_id(),
    public.hash_pin('0000'),
    true
  );

  insert into public.subscriptions (
    user_id,
    status,
    trial_end
  ) values (
    new.id,
    'trialing',
    now() + interval '7 days'
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.create_member_assets();
