alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_members enable row level security;
alter table exercises enable row level security;
alter table workouts enable row level security;
alter table workout_shares enable row level security;
alter table workout_exercises enable row level security;
alter table sets enable row level security;
alter table personal_records enable row level security;

create policy profiles_select_shared on profiles
for select
using (
  id = auth.uid()
  or exists (
    select 1 from group_members gm
    where gm.user_id = profiles.id and is_group_member(gm.group_id)
  )
);
create policy profiles_insert_self on profiles
for insert
with check (id = auth.uid());
create policy profiles_update_self on profiles
for update
using (id = auth.uid())
with check (id = auth.uid());

create policy groups_select_member on groups
for select
using (is_group_member(id));
create policy groups_insert_owner on groups
for insert
with check (auth.uid() is not null and created_by = auth.uid());
create policy groups_update_owner on groups
for update
using (
  exists (
    select 1 from group_members gm
    where gm.group_id = groups.id and gm.user_id = auth.uid() and gm.role = 'owner'
  )
)
with check (
  exists (
    select 1 from group_members gm
    where gm.group_id = groups.id and gm.user_id = auth.uid() and gm.role = 'owner'
  )
);
create policy groups_delete_owner on groups
for delete
using (
  exists (
    select 1 from group_members gm
    where gm.group_id = groups.id and gm.user_id = auth.uid() and gm.role = 'owner'
  )
);

create policy group_members_select_member on group_members
for select
using (is_group_member(group_id));
create policy group_members_delete_self on group_members
for delete
using (user_id = auth.uid());

create policy exercises_select_scope on exercises
for select
using (group_id is null or is_group_member(group_id));
create policy exercises_insert_group_only on exercises
for insert
with check (
  group_id is not null and is_group_member(group_id) and created_by = auth.uid()
);
create policy exercises_update_group_member on exercises
for update
using (group_id is not null and is_group_member(group_id))
with check (group_id is not null and is_group_member(group_id));

create policy workouts_select_visible on workouts
for select
using (
  user_id = auth.uid()
  or (
    ended_at is not null
    and exists (
      select 1 from workout_shares ws
      where ws.workout_id = workouts.id and is_group_member(ws.group_id)
    )
  )
);
create policy workouts_insert_self on workouts
for insert
with check (user_id = auth.uid());
create policy workouts_update_self on workouts
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
create policy workouts_delete_self on workouts
for delete
using (user_id = auth.uid());

create policy workout_shares_select_visible on workout_shares
for select
using (
  is_group_member(group_id)
  or exists (
    select 1 from workouts w where w.id = workout_shares.workout_id and w.user_id = auth.uid()
  )
);
create policy workout_shares_insert_owner_member on workout_shares
for insert
with check (
  is_group_member(group_id)
  and exists (
    select 1 from workouts w where w.id = workout_shares.workout_id and w.user_id = auth.uid()
  )
);
create policy workout_shares_delete_owner_member on workout_shares
for delete
using (
  is_group_member(group_id)
  and exists (
    select 1 from workouts w where w.id = workout_shares.workout_id and w.user_id = auth.uid()
  )
);

create policy workout_exercises_select_visible on workout_exercises
for select
using (
  exists (
    select 1
    from workouts w
    where w.id = workout_exercises.workout_id
      and (
        w.user_id = auth.uid()
        or (
          w.ended_at is not null and exists (
            select 1 from workout_shares ws
            where ws.workout_id = w.id and is_group_member(ws.group_id)
          )
        )
      )
  )
);
create policy workout_exercises_write_owner on workout_exercises
for all
using (
  exists (
    select 1 from workouts w
    where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1 from workouts w
    where w.id = workout_exercises.workout_id and w.user_id = auth.uid()
  )
);

create policy sets_select_visible on sets
for select
using (
  exists (
    select 1
    from workout_exercises we
    join workouts w on w.id = we.workout_id
    where we.id = sets.workout_exercise_id
      and (
        w.user_id = auth.uid()
        or (
          w.ended_at is not null
          and exists (
            select 1 from workout_shares ws
            where ws.workout_id = w.id and is_group_member(ws.group_id)
          )
        )
      )
  )
);
create policy sets_write_owner on sets
for all
using (
  exists (
    select 1
    from workout_exercises we
    join workouts w on w.id = we.workout_id
    where we.id = sets.workout_exercise_id and w.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from workout_exercises we
    join workouts w on w.id = we.workout_id
    where we.id = sets.workout_exercise_id and w.user_id = auth.uid()
  )
);

create policy personal_records_select_shared on personal_records
for select
using (
  user_id = auth.uid()
  or exists (
    select 1 from group_members gm
    where gm.user_id = personal_records.user_id and is_group_member(gm.group_id)
  )
);
create policy personal_records_insert_self on personal_records
for insert
with check (user_id = auth.uid());
create policy personal_records_update_self on personal_records
for update
using (user_id = auth.uid())
with check (user_id = auth.uid());
create policy personal_records_delete_self on personal_records
for delete
using (user_id = auth.uid());

create or replace function create_group(p_name text)
returns groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group groups;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  loop
    begin
      insert into groups (name, join_code, created_by)
      values (trim(p_name), generate_join_code(), auth.uid())
      returning * into v_group;
      exit;
    exception
      when unique_violation then
        null;
    end;
  end loop;

  insert into group_members (group_id, user_id, role)
  values (v_group.id, auth.uid(), 'owner')
  on conflict (group_id, user_id) do nothing;

  return v_group;
end;
$$;

create or replace function join_group_with_code(p_code text)
returns groups
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group groups;
  v_member_count integer;
  v_code text := upper(trim(p_code));
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_group from groups where join_code = v_code for update;
  if not found then
    raise exception 'GROUP_NOT_FOUND';
  end if;

  if exists (
    select 1 from group_members
    where group_id = v_group.id and user_id = auth.uid()
  ) then
    raise exception 'ALREADY_MEMBER';
  end if;

  perform 1 from group_members where group_id = v_group.id for update;

  select count(*) into v_member_count from group_members where group_id = v_group.id;
  if v_member_count >= 10 then
    raise exception 'GROUP_FULL';
  end if;

  insert into group_members (group_id, user_id, role)
  values (v_group.id, auth.uid(), 'member');

  return v_group;
end;
$$;

create or replace function start_workout(p_name text default null)
returns workouts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_existing uuid;
  v_bodyweight numeric(5, 2);
  v_estimated boolean := false;
  v_workout workouts;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select id into v_existing from workouts where user_id = auth.uid() and ended_at is null;
  if v_existing is not null then
    raise exception 'WORKOUT_IN_PROGRESS';
  end if;

  select bodyweight_kg into v_bodyweight from profiles where id = auth.uid();
  if v_bodyweight is null then
    v_bodyweight := 70;
    v_estimated := true;
  end if;

  insert into workouts (user_id, name, bodyweight_kg, bodyweight_estimated)
  values (auth.uid(), nullif(trim(p_name), ''), v_bodyweight, v_estimated)
  returning * into v_workout;

  return v_workout;
end;
$$;

create or replace function recompute_prs_for_exercise(p_user_id uuid, p_exercise_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from personal_records
  where user_id = p_user_id and exercise_id = p_exercise_id;

  insert into personal_records (user_id, exercise_id, type, value, set_id, workout_id, achieved_at)
  select p_user_id, p_exercise_id, 'heaviest_weight', candidate.weight_kg, candidate.set_id, candidate.workout_id, candidate.achieved_at
  from (
    select s.id as set_id, w.id as workout_id, s.weight_kg::numeric as weight_kg, coalesce(w.ended_at, w.started_at) as achieved_at
    from sets s
    join workout_exercises we on we.id = s.workout_exercise_id
    join workouts w on w.id = we.workout_id
    join exercises e on e.id = we.exercise_id
    where w.user_id = p_user_id
      and w.ended_at is not null
      and we.exercise_id = p_exercise_id
      and e.kind in ('weight_reps', 'weighted_bodyweight')
      and s.is_completed
      and s.set_type <> 'warmup'
      and coalesce(s.reps, 0) >= 1
      and s.weight_kg is not null
    order by s.weight_kg desc, achieved_at desc, s.position asc
    limit 1
  ) as candidate;

  insert into personal_records (user_id, exercise_id, type, value, set_id, workout_id, achieved_at)
  select p_user_id, p_exercise_id, 'best_e1rm', candidate.e1rm_value, candidate.set_id, candidate.workout_id, candidate.achieved_at
  from (
    select
      s.id as set_id,
      w.id as workout_id,
      metric_e1rm(
        case
          when e.kind = 'weighted_bodyweight' then greatest(1, w.bodyweight_kg + coalesce(s.weight_kg, 0))
          else s.weight_kg
        end,
        s.reps
      ) as e1rm_value,
      coalesce(w.ended_at, w.started_at) as achieved_at
    from sets s
    join workout_exercises we on we.id = s.workout_exercise_id
    join workouts w on w.id = we.workout_id
    join exercises e on e.id = we.exercise_id
    where w.user_id = p_user_id
      and w.ended_at is not null
      and we.exercise_id = p_exercise_id
      and e.kind in ('weight_reps', 'weighted_bodyweight')
      and s.is_completed
      and s.set_type <> 'warmup'
      and coalesce(s.reps, 0) >= 1
      and s.weight_kg is not null
      and metric_e1rm(
        case
          when e.kind = 'weighted_bodyweight' then greatest(1, w.bodyweight_kg + coalesce(s.weight_kg, 0))
          else s.weight_kg
        end,
        s.reps
      ) is not null
    order by e1rm_value desc, achieved_at desc, s.position asc
    limit 1
  ) as candidate;

  insert into personal_records (user_id, exercise_id, type, value, set_id, workout_id, achieved_at)
  select p_user_id, p_exercise_id, 'most_reps', candidate.reps, candidate.set_id, candidate.workout_id, candidate.achieved_at
  from (
    select s.id as set_id, w.id as workout_id, s.reps::numeric as reps, coalesce(w.ended_at, w.started_at) as achieved_at
    from sets s
    join workout_exercises we on we.id = s.workout_exercise_id
    join workouts w on w.id = we.workout_id
    join exercises e on e.id = we.exercise_id
    where w.user_id = p_user_id
      and w.ended_at is not null
      and we.exercise_id = p_exercise_id
      and e.kind = 'bodyweight_reps'
      and s.is_completed
      and s.set_type <> 'warmup'
      and coalesce(s.reps, 0) >= 1
    order by s.reps desc, achieved_at desc, s.position asc
    limit 1
  ) as candidate;
end;
$$;

create or replace function finish_workout(p_workout_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workout workouts;
  v_finished_at timestamptz;
  v_duration_seconds integer;
  v_volume_kg numeric(12, 3);
  v_exercise_ids uuid[];
  v_exercise_id uuid;
  v_new_prs jsonb := '[]'::jsonb;
  v_deleted_count integer;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select * into v_workout
  from workouts
  where id = p_workout_id and user_id = auth.uid()
  for update;

  if not found then
    raise exception 'WORKOUT_NOT_FOUND';
  end if;

  if v_workout.ended_at is not null then
    raise exception 'WORKOUT_ALREADY_FINISHED';
  end if;

  delete from sets
  where workout_exercise_id in (
    select id from workout_exercises where workout_id = p_workout_id
  )
    and is_completed = false;

  delete from workout_exercises we
  where we.workout_id = p_workout_id
    and not exists (
      select 1 from sets s where s.workout_exercise_id = we.id
    );

  select array_agg(distinct exercise_id order by exercise_id)
  into v_exercise_ids
  from workout_exercises
  where workout_id = p_workout_id;

  if v_exercise_ids is null or array_length(v_exercise_ids, 1) is null then
    delete from workouts where id = p_workout_id and user_id = auth.uid();
    return jsonb_build_object('discarded', true);
  end if;

  v_finished_at := coalesce(v_workout.ended_at, now());

  update workouts
  set ended_at = v_finished_at
  where id = p_workout_id;

  insert into workout_shares (workout_id, group_id)
  select p_workout_id, gm.group_id
  from group_members gm
  where gm.user_id = auth.uid()
  on conflict (workout_id, group_id) do nothing;

  foreach v_exercise_id in array v_exercise_ids loop
    perform recompute_prs_for_exercise(auth.uid(), v_exercise_id);
  end loop;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'exercise_id', exercise_id,
        'type', type,
        'value', value
      )
      order by exercise_id, type
    ),
    '[]'::jsonb
  )
  into v_new_prs
  from personal_records
  where workout_id = p_workout_id and user_id = auth.uid();

  select coalesce(sum(
    case e.kind
      when 'weight_reps' then coalesce(s.weight_kg, 0) * coalesce(s.reps, 0)
      when 'bodyweight_reps' then w.bodyweight_kg * coalesce(s.reps, 0)
      when 'weighted_bodyweight' then greatest(1, w.bodyweight_kg + coalesce(s.weight_kg, 0)) * coalesce(s.reps, 0)
      else 0
    end
  ), 0)
  into v_volume_kg
  from workouts w
  join workout_exercises we on we.workout_id = w.id
  join exercises e on e.id = we.exercise_id
  join sets s on s.workout_exercise_id = we.id
  where w.id = p_workout_id
    and s.is_completed
    and s.set_type <> 'warmup';

  select greatest(0, floor(extract(epoch from (v_finished_at - v_workout.started_at)))::integer)
  into v_duration_seconds;

  return jsonb_build_object(
    'new_prs', v_new_prs,
    'volume_kg', v_volume_kg,
    'duration_seconds', v_duration_seconds
  );
end;
$$;

create or replace function delete_workout(p_workout_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_exercise_ids uuid[];
  v_exercise_id uuid;
  v_deleted_count integer;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select array_agg(distinct exercise_id order by exercise_id)
  into v_exercise_ids
  from workout_exercises
  where workout_id = p_workout_id;

  delete from workouts
  where id = p_workout_id and user_id = auth.uid();

  get diagnostics v_deleted_count = row_count;
  if v_deleted_count = 0 then
    raise exception 'WORKOUT_NOT_FOUND';
  end if;

  if v_exercise_ids is null then
    return;
  end if;

  foreach v_exercise_id in array v_exercise_ids loop
    perform recompute_prs_for_exercise(auth.uid(), v_exercise_id);
  end loop;
end;
$$;

create or replace function last_performance(p_exercise_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_workout_id uuid;
  v_kind exercise_kind;
  v_performed_at timestamptz;
  v_days_ago integer;
  v_sets jsonb := '[]'::jsonb;
  v_count integer := 0;
  v_first_weight numeric(6, 2);
  v_first_reps integer;
  v_first_duration integer;
  v_first_distance numeric(9, 2);
  v_summary text;
begin
  if auth.uid() is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select w.id, e.kind, w.ended_at
  into v_workout_id, v_kind, v_performed_at
  from workouts w
  join workout_exercises we on we.workout_id = w.id
  join exercises e on e.id = we.exercise_id
  where w.user_id = auth.uid()
    and w.ended_at is not null
    and we.exercise_id = p_exercise_id
  order by w.ended_at desc
  limit 1;

  if v_workout_id is null then
    return jsonb_build_object(
      'performed_at', null,
      'days_ago', null,
      'summary_text', 'First time — let''s set a baseline',
      'sets', '[]'::jsonb
    );
  end if;

  v_days_ago := greatest(0, floor(extract(epoch from (now() - v_performed_at)) / 86400)::integer);

  select
    count(*),
    min(case when s.position = 1 then s.weight_kg end),
    min(case when s.position = 1 then s.reps end),
    min(case when s.position = 1 then s.duration_seconds end),
    min(case when s.position = 1 then s.distance_m end),
    coalesce(
      jsonb_agg(
        jsonb_build_object(
          'position', s.position,
          'weight_kg', s.weight_kg,
          'reps', s.reps,
          'duration_seconds', s.duration_seconds,
          'distance_m', s.distance_m,
          'set_type', s.set_type,
          'is_completed', s.is_completed
        )
        order by s.position
      ),
      '[]'::jsonb
    )
  into v_count, v_first_weight, v_first_reps, v_first_duration, v_first_distance, v_sets
  from workout_exercises we
  join sets s on s.workout_exercise_id = we.id
  where we.workout_id = v_workout_id
    and we.exercise_id = p_exercise_id
    and s.is_completed;

  v_summary := case v_kind
    when 'weight_reps' then format('Last: %s days ago · %sx%s @ %s kg', v_days_ago, v_count, coalesce(v_first_reps, 0), coalesce(v_first_weight, 0))
    when 'bodyweight_reps' then format('Last: %s days ago · %sx%s', v_days_ago, v_count, coalesce(v_first_reps, 0))
    when 'weighted_bodyweight' then format('Last: %s days ago · %sx%s @ %s kg', v_days_ago, v_count, coalesce(v_first_reps, 0), coalesce(v_first_weight, 0))
    when 'duration' then format('Last: %s days ago · %sx%s s', v_days_ago, v_count, coalesce(v_first_duration, 0))
    else format('Last: %s days ago · %s m in %s s', v_days_ago, coalesce(v_first_distance, 0), coalesce(v_first_duration, 0))
  end;

  return jsonb_build_object(
    'performed_at', v_performed_at,
    'days_ago', v_days_ago,
    'summary_text', v_summary,
    'sets', v_sets
  );
end;
$$;


revoke all on function create_group(text) from public;
revoke all on function join_group_with_code(text) from public;
revoke all on function start_workout(text) from public;
revoke all on function finish_workout(uuid) from public;
revoke all on function delete_workout(uuid) from public;
revoke all on function last_performance(uuid) from public;
revoke all on function recompute_prs_for_exercise(uuid, uuid) from public;

grant execute on function create_group(text) to authenticated;
grant execute on function join_group_with_code(text) to authenticated;
grant execute on function start_workout(text) to authenticated;
grant execute on function finish_workout(uuid) to authenticated;
grant execute on function delete_workout(uuid) to authenticated;
grant execute on function last_performance(uuid) to authenticated;
