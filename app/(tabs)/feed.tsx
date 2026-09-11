import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { InfoCard } from '@/components/InfoCard';
import { supabase } from '@/lib/supabase';
import { formatKg } from '@/lib/units';

type FeedWorkout = {
  id: string;
  name: string | null;
  bodyweight_kg: number;
  bodyweight_estimated: boolean;
};

export default function FeedScreen() {
  const { data } = useQuery<FeedWorkout[]>({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data: workouts, error } = await (supabase as any)
        .from('workouts')
        .select(
          'id, name, started_at, ended_at, bodyweight_kg, bodyweight_estimated',
        )
        .not('ended_at', 'is', null)
        .order('started_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (workouts ?? []) as FeedWorkout[];
    },
  });

  const workouts = data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>Partner feed</Text>
      <Text style={styles.subtitle}>
        Finished sessions only — in-progress workouts stay private until they
        end.
      </Text>
      {workouts.map((workout) => (
        <Link href={`/workout/${workout.id}`} key={workout.id} asChild>
          <View>
            <InfoCard
              title={workout.name || 'Workout'}
              subtitle={`Bodyweight snapshot ${formatKg(workout.bodyweight_kg)}${workout.bodyweight_estimated ? ' (estimated)' : ''}`}
              rightLabel="Finished"
            >
              <Text style={styles.meta}>
                Duration and new PR data come back from the finish_workout RPC.
              </Text>
            </InfoCard>
          </View>
        </Link>
      ))}
      {workouts.length === 0 ? (
        <InfoCard
          title="No partner sessions yet"
          subtitle="Create a group and finish a workout to populate the feed."
        />
      ) : null}
      <Text style={styles.footnote}>
        est. 1RM and PR badges appear per workout and exercise detail in
        milestone 5.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 20,
  },
  footnote: {
    color: '#98A2B3',
    fontSize: 13,
  },
  meta: {
    color: '#98A2B3',
    fontSize: 13,
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
