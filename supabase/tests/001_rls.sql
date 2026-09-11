create extension if not exists pgtap;

begin;

select plan(11);

create temp table test_ids (
  user_a uuid,
  user_b uuid,
  user_c uuid,
  group_id uuid,
  active_workout_id uuid,
  custom_exercise_id uuid
);

insert into test_ids values (
  '00000000-0000-0000-0000-0000000000a1',
  '00000000-0000-0000-0000-0000000000b2',
  '00000000-0000-0000-0000-0000000000c3',
  null,
  null,
  null
);

insert into auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
select
  '00000000-0000-0000-0000-000000000000',
  user_id,
  'authenticated',
  'authenticated',
  email,
  crypt('password', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', name),
  now(),
  now()
from (
  select user_a as user_id, 'a@example.com' as email, 'Alice' as name from test_ids
  union all
  select user_b, 'b@example.com', 'Bea' from test_ids
  union all
  select user_c, 'c@example.com', 'Casey' from test_ids
) seeded_users;

reset role;
insert into exercises (name, kind, primary_muscle, equipment)
values ('Test Bench', 'weight_reps', 'chest', 'barbell')
on conflict do nothing;

select set_config('request.jwt.claim.role', 'authenticated', true);
set local role authenticated;

select set_config('request.jwt.claim.sub', (select user_a::text from test_ids), true);
select is((select (create_group('Training duo')).created_by), (select user_a from test_ids), 'user A can create a group');
update test_ids set group_id = (select id from groups where created_by = user_a limit 1);
select is(
  (select role from group_members where group_id = (select group_id from test_ids) and user_id = (select user_a from test_ids)),
  'owner'::group_role,
  'creator becomes owner'
);

select set_config('request.jwt.claim.sub', (select user_b::text from test_ids), true);
select lives_ok(
  $$ select join_group_with_code((select join_code from groups where id = (select group_id from test_ids))) $$,
  'user B can join with the generated code'
);
select is((select count(*) from profiles where id = (select user_a from test_ids)), 1::bigint, 'group mates can read each others profiles');

select set_config('request.jwt.claim.sub', (select user_c::text from test_ids), true);
select throws_ok($$ select join_group_with_code('ZZZZZZ') $$, 'GROUP_NOT_FOUND', 'bad join code is rejected');
select is((select count(*) from groups), 0::bigint, 'outsider cannot read groups they do not belong to');
select is((select count(*) from exercises where name = 'Partner Cable Fly'), 0::bigint, 'outsider cannot see another groups custom exercise');
select throws_ok(
  $$ insert into exercises (group_id, name, kind, primary_muscle, equipment, created_by) values ((select group_id from test_ids), 'Leaked Exercise', 'weight_reps', 'back', 'barbell', (select user_c from test_ids)) $$,
  'new row violates row-level security policy for table "exercises"',
  'non-members cannot create custom exercises in another group'
);

select set_config('request.jwt.claim.sub', (select user_a::text from test_ids), true);
with inserted as (
  insert into exercises (group_id, name, kind, primary_muscle, equipment, created_by)
  values ((select group_id from test_ids), 'Partner Cable Fly', 'weight_reps', 'chest', 'cable', (select user_a from test_ids))
  returning id
)
update test_ids set custom_exercise_id = (select id from inserted limit 1);
select is((select count(*) from exercises where id = (select custom_exercise_id from test_ids)), 1::bigint, 'creator can read their custom exercise');
select is((select (start_workout('Heavy day')).user_id), (select user_a from test_ids), 'user A can start a workout');
update test_ids set active_workout_id = (select id from workouts where user_id = user_a and ended_at is null limit 1);
insert into workout_exercises (workout_id, exercise_id, position)
values (
  (select active_workout_id from test_ids),
  (select id from exercises where name = 'Test Bench' limit 1),
  1
);
insert into sets (workout_exercise_id, position, weight_kg, reps, is_completed)
values (
  (select id from workout_exercises where workout_id = (select active_workout_id from test_ids) limit 1),
  1,
  100,
  5,
  true
);

select set_config('request.jwt.claim.sub', (select user_b::text from test_ids), true);
select is((select count(*) from workouts where id = (select active_workout_id from test_ids)), 0::bigint, 'in-progress workouts stay private from partners');

select set_config('request.jwt.claim.sub', (select user_a::text from test_ids), true);
select lives_ok($$ select finish_workout((select active_workout_id from test_ids)) $$, 'finish_workout shares the finished workout');

select set_config('request.jwt.claim.sub', (select user_b::text from test_ids), true);
select is((select count(*) from workouts where id = (select active_workout_id from test_ids)), 1::bigint, 'finished workouts are visible to group mates');

select * from finish();
rollback;
