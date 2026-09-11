import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InfoCard } from '@/components/InfoCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SetRowInput } from '@/components/SetRowInput';
import { lastPerformanceSummary, type ExerciseKind } from '@/lib/metrics';
import { supabase } from '@/lib/supabase';

type WorkoutRow = {
  id: string;
  name: string | null;
  ended_at: string | null;
};

type ExerciseLink = {
  exerciseId: string;
  exerciseName: string;
  exerciseKind: ExerciseKind;
};

type PreviousSet = {
  weightKg: string;
  reps: string;
  durationSeconds: string;
  distanceM: string;
};

const emptySet = (): PreviousSet => ({
  weightKg: '',
  reps: '',
  durationSeconds: '',
  distanceM: '',
});

export default function WorkoutDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [sets, setSets] = useState<PreviousSet[]>([
    emptySet(),
    emptySet(),
    emptySet(),
  ]);

  const workoutQuery = useQuery<WorkoutRow | null>({
    queryKey: ['workout', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('workouts')
        .select(
          'id, name, started_at, ended_at, bodyweight_kg, bodyweight_estimated',
        )
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as WorkoutRow | null;
    },
  });

  const exerciseLinkQuery = useQuery<ExerciseLink | null>({
    queryKey: ['workout-exercise-link', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data: links, error: linkError } = await (supabase as any)
        .from('workout_exercises')
        .select('exercise_id, exercises(id, name, kind)')
        .eq('workout_id', id)
        .order('position')
        .limit(1);
      if (linkError) throw linkError;

      const link = links?.[0];
      const exercise = Array.isArray(link?.exercises)
        ? link.exercises[0]
        : link?.exercises;
      if (!link?.exercise_id || !exercise) return null;

      return {
        exerciseId: link.exercise_id,
        exerciseName: exercise.name,
        exerciseKind: exercise.kind as ExerciseKind,
      };
    },
  });

  const lastPerformanceQuery = useQuery<{
    days_ago?: number;
    sets?: Record<string, string | number | null>[];
  } | null>({
    queryKey: ['last-performance', exerciseLinkQuery.data?.exerciseId],
    enabled: Boolean(exerciseLinkQuery.data?.exerciseId),
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('last_performance', {
        p_exercise_id: exerciseLinkQuery.data?.exerciseId,
      });
      if (error) throw error;
      return data as {
        days_ago?: number;
        sets?: Record<string, string | number | null>[];
      } | null;
    },
  });

  const finishWorkout = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).rpc('finish_workout', {
        p_workout_id: id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workout', id] });
      await queryClient.invalidateQueries({ queryKey: ['feed'] });
      Alert.alert(
        'Workout finished',
        'Any incomplete placeholder sets were swept before sharing.',
      );
    },
    onError: (error: Error) =>
      Alert.alert('Could not finish workout', error.message),
  });

  const previousSets = useMemo<PreviousSet[]>(
    () =>
      (lastPerformanceQuery.data?.sets ?? []).map((set) => ({
        weightKg: set.weight_kg?.toString?.() ?? '',
        reps: set.reps?.toString?.() ?? '',
        durationSeconds: set.duration_seconds?.toString?.() ?? '',
        distanceM: set.distance_m?.toString?.() ?? '',
      })),
    [lastPerformanceQuery.data?.sets],
  );

  const exerciseKind = exerciseLinkQuery.data?.exerciseKind ?? 'weight_reps';
  const exerciseName = exerciseLinkQuery.data?.exerciseName ?? 'Exercise';
  const summary =
    lastPerformanceQuery.data?.days_ago != null
      ? lastPerformanceSummary(
          exerciseKind,
          lastPerformanceQuery.data.days_ago,
          previousSets.map((set) => ({
            reps: Number(set.reps || 0),
            weightKg: Number(set.weightKg || 0),
            durationSeconds: Number(set.durationSeconds || 0),
            distanceM: Number(set.distanceM || 0),
          })),
        )
      : `First time — let's set a baseline`;

  const workout = workoutQuery.data;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <InfoCard
        title={workout?.name || 'Workout'}
        subtitle={summary}
        rightLabel={workout?.ended_at ? 'Finished' : 'Live'}
      >
        <Text style={styles.hint}>
          SPEC-GAP: exercise search/add flow still needs the final UX shell, but
          the set-row component already branches on exercise kind and supports
          placeholder deltas.
        </Text>
      </InfoCard>
      <InfoCard
        title={exerciseName}
        subtitle="Last session values render as placeholders until you accept or override them."
      >
        <View style={styles.sets}>
          {sets.map((set, index) => (
            <SetRowInput
              key={index}
              kind={exerciseKind}
              label={`Set ${index + 1}`}
              previous={previousSets[index]}
              value={set}
              onChange={(next) => {
                setSets((current) =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? { ...emptySet(), ...next } : item,
                  ),
                );
              }}
            />
          ))}
        </View>
      </InfoCard>
      {!workout?.ended_at ? (
        <PrimaryButton
          label="Finish workout"
          onPress={() => finishWorkout.mutate()}
          loading={finishWorkout.isPending}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 20,
  },
  hint: {
    color: '#98A2B3',
    fontSize: 13,
  },
  screen: {
    backgroundColor: '#0C111D',
  },
  sets: {
    gap: 12,
  },
});
