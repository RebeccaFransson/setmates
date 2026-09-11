import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { InfoCard } from '@/components/InfoCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { supabase } from '@/lib/supabase';
import { formatKg } from '@/lib/units';

type ActiveWorkout = {
  id: string;
  name: string | null;
  bodyweight_kg: number;
  bodyweight_estimated: boolean;
};

export default function WorkoutScreen() {
  const queryClient = useQueryClient();

  const activeWorkoutQuery = useQuery<ActiveWorkout | null>({
    queryKey: ['active-workout'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('workouts')
        .select('id, name, bodyweight_kg, bodyweight_estimated, started_at')
        .is('ended_at', null)
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ActiveWorkout | null;
    },
  });

  const startWorkout = useMutation({
    mutationFn: async () => {
      const { data, error } = await (supabase as any).rpc('start_workout', {
        p_name: null,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['active-workout'] });
    },
    onError: (error: Error) =>
      Alert.alert('Could not start workout', error.message),
  });

  const workout = activeWorkoutQuery.data;

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>Log a session</Text>
      <Text style={styles.subtitle}>
        Only one live workout per lifter. Resume it or finish/discard it before
        starting another.
      </Text>

      {workout ? (
        <Link href={`/workout/${workout.id}`} asChild>
          <View>
            <InfoCard
              title={workout.name || 'Untitled workout'}
              subtitle={`Snapshot ${formatKg(workout.bodyweight_kg)}${workout.bodyweight_estimated ? ' (estimated)' : ''}`}
              rightLabel="In progress"
            >
              <Text style={styles.body}>
                Open the workout to add exercises, complete sets, and finish it.
              </Text>
            </InfoCard>
          </View>
        </Link>
      ) : (
        <InfoCard
          title="No active workout"
          subtitle="start_workout snapshots bodyweight and enforces the single active workout rule."
        >
          <PrimaryButton
            label="Start workout"
            onPress={() => startWorkout.mutate()}
            loading={startWorkout.isPending}
          />
        </InfoCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  body: {
    color: '#98A2B3',
    fontSize: 14,
  },
  content: {
    gap: 16,
    padding: 20,
  },
  screen: {
    backgroundColor: '#0C111D',
  },
  subtitle: {
    color: '#98A2B3',
    fontSize: 15,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 30,
    fontWeight: '800',
  },
});
