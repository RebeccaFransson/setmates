export type ExerciseKind =
  | 'weight_reps'
  | 'bodyweight_reps'
  | 'weighted_bodyweight'
  | 'duration'
  | 'distance_duration';

export type SetType = 'normal' | 'warmup' | 'dropset' | 'failure';

export type MetricSet = {
  kind: ExerciseKind;
  setType?: SetType;
  isCompleted?: boolean;
  weightKg?: number | null;
  reps?: number | null;
  durationSeconds?: number | null;
  distanceM?: number | null;
  bodyweightKg?: number | null;
};

export function e1rm(totalLoadKg: number, reps: number): number | null {
  if (reps < 1 || totalLoadKg <= 0) return null;
  if (reps === 1) return totalLoadKg;
  if (reps > 12) return null;
  const epley = totalLoadKg * (1 + reps / 30);
  const brzycki = (totalLoadKg * 36) / (37 - reps);
  return (epley + brzycki) / 2;
}

export function roundToQuarterKg(value: number): number {
  return Math.round(value * 4) / 4;
}

export function roundToTenthKg(value: number): number {
  return Math.round(value * 10) / 10;
}

export function totalLoadKg(
  kind: ExerciseKind,
  bodyweightKg: number,
  weightKg?: number | null,
): number | null {
  if (kind === 'weight_reps')
    return weightKg != null && weightKg > 0 ? weightKg : null;
  if (kind === 'weighted_bodyweight')
    return Math.max(1, bodyweightKg + (weightKg ?? 0));
  if (kind === 'bodyweight_reps') return bodyweightKg > 0 ? bodyweightKg : null;
  return null;
}

export function setVolumeKg(set: MetricSet): number {
  if (set.isCompleted === false || set.setType === 'warmup') return 0;
  const reps = set.reps ?? 0;
  const bodyweightKg = set.bodyweightKg ?? 0;
  switch (set.kind) {
    case 'weight_reps':
      return (set.weightKg ?? 0) * reps;
    case 'bodyweight_reps':
      return bodyweightKg * reps;
    case 'weighted_bodyweight':
      return Math.max(1, bodyweightKg + (set.weightKg ?? 0)) * reps;
    default:
      return 0;
  }
}

export function workoutVolumeKg(sets: MetricSet[]): number {
  return sets.reduce((sum, set) => sum + setVolumeKg(set), 0);
}

export function deltaText(
  kind: ExerciseKind,
  current: MetricSet,
  previous?: MetricSet | null,
): string | null {
  if (!previous) return null;
  if (kind === 'duration') {
    const delta =
      (current.durationSeconds ?? 0) - (previous.durationSeconds ?? 0);
    return delta === 0 ? null : `${delta > 0 ? '+' : ''}${delta} s`;
  }
  if (kind === 'distance_duration') {
    const delta = (current.distanceM ?? 0) - (previous.distanceM ?? 0);
    return delta === 0 ? null : `${delta > 0 ? '+' : ''}${delta} m`;
  }
  const repsDelta = (current.reps ?? 0) - (previous.reps ?? 0);
  const weightDelta = (current.weightKg ?? 0) - (previous.weightKg ?? 0);
  if (repsDelta !== 0)
    return `${repsDelta > 0 ? '+' : ''}${repsDelta} rep${Math.abs(repsDelta) === 1 ? '' : 's'}`;
  if (weightDelta !== 0)
    return `${weightDelta > 0 ? '+' : ''}${weightDelta} kg`;
  return null;
}

export function lastPerformanceSummary(
  kind: ExerciseKind,
  daysAgo: number,
  sets: Pick<
    MetricSet,
    'reps' | 'weightKg' | 'durationSeconds' | 'distanceM'
  >[],
): string {
  if (sets.length === 0) return `Last: ${daysAgo} days ago`;
  const first = sets[0];
  const count = sets.length;
  switch (kind) {
    case 'weight_reps':
    case 'weighted_bodyweight':
      return `Last: ${daysAgo} days ago · ${count}×${first.reps ?? 0} @ ${first.weightKg ?? 0} kg`;
    case 'bodyweight_reps':
      return `Last: ${daysAgo} days ago · ${count}×${first.reps ?? 0}`;
    case 'duration':
      return `Last: ${daysAgo} days ago · ${count}×${first.durationSeconds ?? 0} s`;
    case 'distance_duration':
      return `Last: ${daysAgo} days ago · ${first.distanceM ?? 0} m in ${first.durationSeconds ?? 0} s`;
  }
}
