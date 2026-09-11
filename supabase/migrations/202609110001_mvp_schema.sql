create extension if not exists pgcrypto;

create type exercise_kind as enum (
  'weight_reps',
  'bodyweight_reps',
  'weighted_bodyweight',
  'duration',
  'distance_duration'
);
create type set_type as enum ('normal', 'warmup', 'dropset', 'failure');
create type unit_system as enum ('metric', 'imperial');
create type group_role as enum ('owner', 'member');
create type pr_type as enum ('heaviest_weight', 'best_e1rm', 'most_reps');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  avatar_url text,
  unit_preference unit_system not null default 'metric',
  bodyweight_kg numeric(5, 2),
  created_at timestamptz not null default now()
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 60),
  join_code text not null unique,
  created_by uuid not null references profiles (id),
  created_at timestamptz not null default now()
);

create table group_members (
  group_id uuid not null references groups (id) on delete cascade,
  user_id uuid not null references profiles (id) on delete cascade,
  role group_role not null default 'member',
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create table exercises (
  id uuid primary key default gen_random_uuid(),
  group_id uuid references groups (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  kind exercise_kind not null,
  primary_muscle text not null,
  equipment text,
  is_archived boolean not null default false,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);
create unique index exercises_unique_name_per_scope on exercises (
  coalesce(group_id, '00000000-0000-0000-0000-000000000000'::uuid),
  lower(name)
);

create table workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  name text,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  bodyweight_kg numeric(5, 2) not null,
  bodyweight_estimated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workouts_user_started on workouts (user_id, started_at desc);
create unique index one_active_workout on workouts (user_id)
where
  ended_at is null;

create table workout_shares (
  workout_id uuid not null references workouts (id) on delete cascade,
  group_id uuid not null references groups (id) on delete cascade,
  primary key (workout_id, group_id)
);
create index workout_shares_group on workout_shares (group_id);

create table workout_exercises (
  id uuid primary key default gen_random_uuid(),
  workout_id uuid not null references workouts (id) on delete cascade,
  exercise_id uuid not null references exercises (id),
  position integer not null,
  notes text,
  updated_at timestamptz not null default now()
);
create index workout_exercises_workout on workout_exercises (workout_id, position);

create table sets (
  id uuid primary key default gen_random_uuid(),
  workout_exercise_id uuid not null references workout_exercises (id) on delete cascade,
  position integer not null,
  set_type set_type not null default 'normal',
  weight_kg numeric(6, 2),
  reps integer check (reps is null or reps >= 0),
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  distance_m numeric(9, 2),
  rpe numeric(3, 1) check (rpe is null or (rpe >= 1 and rpe <= 10)),
  is_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sets_workout_exercise on sets (workout_exercise_id, position);

create or replace function touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sets_touch before update on sets for each row
execute function touch_updated_at();
create trigger workout_exercises_touch before update on workout_exercises for each row
execute function touch_updated_at();
create trigger workouts_touch before update on workouts for each row
execute function touch_updated_at();

create table personal_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles (id) on delete cascade,
  exercise_id uuid not null references exercises (id) on delete cascade,
  type pr_type not null,
  value numeric(10, 3) not null,
  set_id uuid references sets (id) on delete set null,
  workout_id uuid references workouts (id) on delete set null,
  achieved_at timestamptz not null,
  unique (user_id, exercise_id, type)
);

create or replace function metric_e1rm(p_total_load_kg numeric, p_reps integer)
returns numeric
language sql
immutable
as $$
  select case
    when p_total_load_kg <= 0 or p_reps < 1 or p_reps > 12 then null
    when p_reps = 1 then p_total_load_kg
    else (
      (p_total_load_kg * (1 + p_reps::numeric / 30)) +
      (p_total_load_kg * 36 / (37 - p_reps))
    ) / 2
  end;
$$;

create or replace function generate_join_code()
returns text
language plpgsql
as $$
declare
  v_chars constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code text := '';
  v_index integer;
begin
  for v_index in 1..6 loop
    v_code := v_code || substr(v_chars, floor(random() * char_length(v_chars) + 1)::integer, 1);
  end loop;
  return v_code;
end;
$$;

create or replace function is_group_member(gid uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from group_members
    where group_id = gid and user_id = auth.uid()
  );
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_display_name text;
begin
  v_display_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'Lifter'
    ),
    40
  );

  insert into public.profiles (id, display_name)
  values (new.id, v_display_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function handle_new_user();
