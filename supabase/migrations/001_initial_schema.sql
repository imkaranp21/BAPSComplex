-- ============================================================
-- Yogi Sports Complex — Initial Schema
-- ============================================================

-- ── Profiles ─────────────────────────────────────────────────
-- Extends Supabase auth.users with member-specific fields
create table public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  full_name          text not null,
  phone              text,
  -- Admin-only: never exposed to members in queries
  membership_group   text check (membership_group in ('satsangi', 'non_satsangi')),
  membership_tier    int  check (membership_tier in (1, 2)),
  membership_status  text not null default 'pending'
                     check (membership_status in ('active', 'pending', 'suspended')),
  avatar_url         text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

-- ── Membership Tiers ─────────────────────────────────────────
create table public.membership_tiers (
  id                    uuid primary key default gen_random_uuid(),
  membership_group      text not null check (membership_group in ('satsangi', 'non_satsangi')),
  tier                  int  not null check (tier in (1, 2)),
  display_name          text not null,           -- what members see, e.g. "Tier 1"
  monthly_price_kes     numeric(10,2),
  annual_price_kes      numeric(10,2),
  advance_booking_days  int not null default 2,
  is_active             boolean not null default true,
  unique (membership_group, tier)
);

-- Seed default tiers
insert into public.membership_tiers (membership_group, tier, display_name, advance_booking_days) values
  ('satsangi',     1, 'Tier 1', 2),
  ('satsangi',     2, 'Tier 2', 2),
  ('non_satsangi', 1, 'Tier 1', 2),
  ('non_satsangi', 2, 'Tier 2', 2);

-- ── Spaces ───────────────────────────────────────────────────
create table public.spaces (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,  -- 'gym', 'cricket-futsal', etc.
  name        text not null,
  description text,
  capacity    int,                   -- null = no cap
  is_bookable boolean not null default true,
  is_active   boolean not null default true,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Seed spaces
insert into public.spaces (slug, name, description, capacity, sort_order) values
  ('gym',            'Gym',              'Fully equipped fitness center', 30, 1),
  ('cricket-futsal', 'Cricket / Futsal', 'Multi-use indoor court',        null, 2),
  ('volleyball',     'Volleyball',       '1 court available',             null, 3),
  ('table-tennis',   'Table Tennis',     '2 tables available',            null, 4),
  ('pool-table',     'Pool Table',       '1 table available',             null, 5),
  ('darts',          'Darts',            'Darts area',                    null, 6);

-- ── Space Units ──────────────────────────────────────────────
-- Individual bookable units within a space (e.g. Table 1, Table 2)
create table public.space_units (
  id        uuid primary key default gen_random_uuid(),
  space_id  uuid not null references public.spaces(id) on delete cascade,
  name      text not null,
  is_active boolean not null default true
);

-- Seed units for table tennis and pool
insert into public.space_units (space_id, name)
  select id, 'Table 1' from public.spaces where slug = 'table-tennis'
  union all
  select id, 'Table 2' from public.spaces where slug = 'table-tennis'
  union all
  select id, 'Table 1' from public.spaces where slug = 'pool-table';

-- ── Bookings ─────────────────────────────────────────────────
create table public.bookings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles(id) on delete cascade,
  space_id       uuid not null references public.spaces(id),
  space_unit_id  uuid references public.space_units(id),
  date           date not null,
  start_time     time not null,
  end_time       time not null,
  status         text not null default 'confirmed'
                 check (status in ('confirmed', 'cancelled', 'no_show')),
  notes          text,
  created_at     timestamptz not null default now(),
  -- Prevent double-booking the same unit or space at the same time
  constraint no_unit_overlap exclude using gist (
    space_unit_id with =,
    date with =,
    tsrange(
      (date || ' ' || start_time)::timestamp,
      (date || ' ' || end_time)::timestamp
    ) with &&
  ) where (space_unit_id is not null and status = 'confirmed'),
  constraint end_after_start check (end_time > start_time)
);

create index bookings_user_id_idx  on public.bookings(user_id);
create index bookings_space_id_idx on public.bookings(space_id);
create index bookings_date_idx     on public.bookings(date);

-- ── Gym Check-ins ────────────────────────────────────────────
-- Tracks live gym occupancy (walk-in or member)
create table public.gym_checkins (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references public.profiles(id),  -- null = anonymous walk-in
  checked_in_at   timestamptz not null default now(),
  checked_out_at  timestamptz,
  is_active       boolean generated always as (checked_out_at is null) stored
);

create index gym_checkins_active_idx on public.gym_checkins(is_active);

-- ── Admin Roles ──────────────────────────────────────────────
create table public.admin_roles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  role        text not null check (role in ('super_admin', 'admin')),
  created_by  uuid references auth.users(id),
  created_at  timestamptz not null default now()
);

-- ── Updated_at trigger ───────────────────────────────────────
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ── Auto-create profile on signup ────────────────────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Row Level Security
-- ============================================================

alter table public.profiles        enable row level security;
alter table public.membership_tiers enable row level security;
alter table public.spaces           enable row level security;
alter table public.space_units      enable row level security;
alter table public.bookings         enable row level security;
alter table public.gym_checkins     enable row level security;
alter table public.admin_roles      enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_roles where user_id = auth.uid()
  );
$$;

-- Helper: is the current user a super admin?
create or replace function public.is_super_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_roles
    where user_id = auth.uid() and role = 'super_admin'
  );
$$;

-- profiles
create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id or public.is_admin());

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (
    -- members cannot change their own group or tier
    membership_group = (select membership_group from public.profiles where id = auth.uid()) and
    membership_tier  = (select membership_tier  from public.profiles where id = auth.uid())
  );

create policy "Admins manage all profiles"
  on public.profiles for all
  using (public.is_admin());

-- membership_tiers (public read, but hide group field via a view instead)
create policy "Anyone can read tiers"
  on public.membership_tiers for select
  using (true);

create policy "Admins manage tiers"
  on public.membership_tiers for all
  using (public.is_admin());

-- spaces (public read)
create policy "Anyone can read spaces"
  on public.spaces for select
  using (true);

create policy "Admins manage spaces"
  on public.spaces for all
  using (public.is_admin());

-- space_units (public read)
create policy "Anyone can read space units"
  on public.space_units for select
  using (true);

create policy "Admins manage space units"
  on public.space_units for all
  using (public.is_admin());

-- bookings
create policy "Users read own bookings"
  on public.bookings for select
  using (auth.uid() = user_id or public.is_admin());

create policy "Users create own bookings"
  on public.bookings for insert
  with check (auth.uid() = user_id);

create policy "Users cancel own bookings"
  on public.bookings for update
  using (auth.uid() = user_id)
  with check (status = 'cancelled');

create policy "Admins manage all bookings"
  on public.bookings for all
  using (public.is_admin());

-- gym_checkins (admin only for now)
create policy "Admins manage checkins"
  on public.gym_checkins for all
  using (public.is_admin());

-- admin_roles (super admin only)
create policy "Super admins manage admin roles"
  on public.admin_roles for all
  using (public.is_super_admin());

-- ── Member-safe view (hides membership_group) ────────────────
create or replace view public.my_profile as
  select
    id,
    full_name,
    phone,
    membership_tier,
    membership_status,
    avatar_url,
    created_at
  from public.profiles
  where id = auth.uid();
