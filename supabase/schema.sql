-- MilesWorth Database Schema
-- Run this in Supabase SQL Editor

create table if not exists profiles (
  id uuid references auth.users primary key,
  full_name text,
  business_name text,
  default_vehicle_id uuid,
  stripe_customer_id text unique,
  subscription_status text default 'none'
    check (subscription_status in ('none','trialing','active','past_due','canceled')),
  subscription_period_end timestamptz,
  created_at timestamptz default now()
);

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', null));
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create table if not exists vehicles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  name text not null,
  license_plate text,
  starting_odometer numeric,
  is_default boolean default false,
  archived boolean default false,
  created_at timestamptz default now()
);

create table if not exists trips (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  vehicle_id uuid references vehicles(id) on delete restrict not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  start_address text,
  end_address text,
  start_lat numeric,
  start_lng numeric,
  end_lat numeric,
  end_lng numeric,
  distance_miles numeric not null default 0,
  category text not null default 'business'
    check (category in ('business','personal','medical','charity')),
  purpose text,
  notes text,
  auto_detected boolean default false,
  user_confirmed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_trips_user_date on trips(user_id, started_at desc);
create index if not exists idx_trips_user_category on trips(user_id, category);
create index if not exists idx_vehicles_user on vehicles(user_id);

alter table profiles enable row level security;
alter table vehicles enable row level security;
alter table trips enable row level security;

create policy "users see own profile" on profiles for all using (id = auth.uid());
create policy "users manage own vehicles" on vehicles for all using (user_id = auth.uid());
create policy "users manage own trips" on trips for all using (user_id = auth.uid());
