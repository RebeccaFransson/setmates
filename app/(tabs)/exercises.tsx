import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { InfoCard } from '@/components/InfoCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { supabase } from '@/lib/supabase';

type ExerciseRow = {
  id: string;
  name: string;
  kind: string;
  primary_muscle: string;
  group_id: string | null;
};

const defaultKind = 'weight_reps';

export default function ExercisesScreen() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [muscle, setMuscle] = useState('');
  const [groupId, setGroupId] = useState('');

  const exercisesQuery = useQuery<ExerciseRow[]>({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('exercises')
        .select('id, name, kind, primary_muscle, group_id, is_archived')
        .eq('is_archived', false)
        .order('name');
      if (error) throw error;
      return (data ?? []) as ExerciseRow[];
    },
  });

  const createExercise = useMutation({
    mutationFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const { error } = await (supabase as any).from('exercises').insert({
        name: name.trim(),
        kind: defaultKind,
        primary_muscle: muscle.trim() || 'full body',
        group_id: groupId.trim() || undefined,
        created_by: session?.user.id,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setName('');
      setMuscle('');
      await queryClient.invalidateQueries({ queryKey: ['exercises'] });
    },
    onError: (error: Error) =>
      Alert.alert('Could not create exercise', error.message),
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return exercisesQuery.data ?? [];
    return (exercisesQuery.data ?? []).filter(
      (exercise) =>
        exercise.name.toLowerCase().includes(q) ||
        exercise.primary_muscle.toLowerCase().includes(q),
    );
  }, [exercisesQuery.data, search]);

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>Exercises</Text>
      <FormField
        label="Search"
        value={search}
        onChangeText={setSearch}
        placeholder="Bench, quads, running…"
      />
      <InfoCard
        title="Create custom exercise"
        subtitle="Group exercises are shared forever with your training partner."
      >
        <View style={styles.form}>
          <FormField
            label="Name"
            value={name}
            onChangeText={setName}
            placeholder="Spoto Press"
          />
          <FormField
            label="Primary muscle"
            value={muscle}
            onChangeText={setMuscle}
            placeholder="chest"
          />
          <FormField
            label="Group id"
            value={groupId}
            onChangeText={setGroupId}
            placeholder="Paste your group UUID"
            autoCapitalize="none"
          />
          <Text style={styles.hint}>
            SPEC-GAP: near-duplicate warnings and richer kind selection need
            final design polish.
          </Text>
          <PrimaryButton
            label="Save exercise"
            onPress={() => createExercise.mutate()}
            loading={createExercise.isPending}
          />
        </View>
      </InfoCard>
      {filtered.map((exercise) => (
        <Link href={`/exercise/${exercise.id}`} key={exercise.id} asChild>
          <View>
            <InfoCard
              title={exercise.name}
              subtitle={`${exercise.primary_muscle} · ${exercise.kind}${exercise.group_id ? ' · custom' : ' · global'}`}
            />
          </View>
        </Link>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 20,
  },
  form: {
    gap: 12,
  },
  hint: {
    color: '#98A2B3',
    fontSize: 12,
  },
  screen: {
    backgroundColor: '#0C111D',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 30,
    fontWeight: '800',
  },
});
