import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { InfoCard } from '@/components/InfoCard';
import { db } from '@/lib/supabase';

type ExerciseRow = {
  name: string;
  kind: string;
  primary_muscle: string;
  equipment: string | null;
};

type RecordRow = {
  type: string;
  value: number;
  achieved_at: string;
};

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const exerciseQuery = useQuery<ExerciseRow | null>({
    queryKey: ['exercise', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await db
        .from('exercises')
        .select('id, name, kind, primary_muscle, equipment')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as ExerciseRow | null;
    },
  });

  const recordsQuery = useQuery<RecordRow[]>({
    queryKey: ['exercise-records', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await db
        .from('personal_records')
        .select('type, value, achieved_at')
        .eq('exercise_id', id)
        .order('achieved_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as RecordRow[];
    },
  });

  const records = recordsQuery.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <InfoCard
        title={exerciseQuery.data?.name || 'Exercise'}
        subtitle={`${exerciseQuery.data?.primary_muscle ?? '—'} · ${exerciseQuery.data?.kind ?? '—'}`}
      >
        <Text style={styles.text}>
          Equipment: {exerciseQuery.data?.equipment ?? 'none'}
        </Text>
        <Text style={styles.text}>
          Exercise detail is where the MVP shows est. 1RM, PRs, and a plain list
          of past sessions.
        </Text>
      </InfoCard>
      {records.map((record, index) => (
        <InfoCard
          key={`${record.type}-${index}`}
          title={record.type}
          subtitle={`${record.value} · ${record.achieved_at}`}
          rightLabel="PR"
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 20,
  },
  screen: {
    backgroundColor: '#0C111D',
  },
  text: {
    color: '#98A2B3',
    fontSize: 14,
  },
});
