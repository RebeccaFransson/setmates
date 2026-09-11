import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InfoCard } from '@/components/InfoCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SetRowInput } from '@/components/SetRowInput';
import { type ExerciseKind } from '@/lib/metrics';
import { supabase } from '@/lib/supabase';

type PreviousSet = {
  weightKg: string;
  reps: string;
  durationSeconds: string;
  distanceM: string;
};

type WorkoutDetail = {
  id: string;
  name: string | null;
  ended_at: string | null;
  exerciseId: string | null;
  exerciseName: string;
  exerciseKind: ExerciseKind;
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

  const workoutQuery = useQuery<WorkoutDetail | null>({
    queryKey: ['workout', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('workouts')
        .select(
          'id, name, ended_at, workout_exercises(position, exercise_id, exercises(id, name, kind))',
        )
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;

      const firstLink = [...(data.workout_exercises ?? [])].sort(
        (a, b) => (a.position ?? 0) - (b.position ?? 0),
      )[0];
      const exercise = Array.isArray(firstLink?.exercises)
        ? firstLink.exercises[0]
        : firstLink?.exercises;

      return {
        id: data.id,
        name: data.name,
        ended_at: data.ended_at,
        exerciseId: firstLink?.exercise_id ?? null,
        exerciseName: exercise?.name ?? 'Exercise',
        exerciseKind: (exercise?.kind ?? 'weight_reps') as ExerciseKind,
      };
    },
  });

  const lastPerformanceQuery = useQuery<{
    summary_text?: string;
    sets?: Record<string, string | number | null>[];
  } | null>({
    queryKey: ['last-performance', workoutQuery.data?.exerciseId],
    enabled: Boolean(workoutQuery.data?.exerciseId),
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc('last_performance', {
        p_exercise_id: workoutQuery.data?.exerciseId,
      });
      if (error) throw error;
      return data as {
        summary_text?: string;
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
      await queryClient.invalidateQueries({ queryKey: ['active-workout'] });
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

  const summary =
    lastPerformanceQuery.data?.summary_text ??
    `First time — let's set a baseline`;
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
        title={workout?.exerciseName ?? 'Exercise'}
        subtitle="Last session values render as placeholders until you accept or override them."
      >
        <View style={styles.sets}>
          {sets.map((set, index) => (
            <SetRowInput
              key={index}
              kind={workout?.exerciseKind ?? 'weight_reps'}
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
