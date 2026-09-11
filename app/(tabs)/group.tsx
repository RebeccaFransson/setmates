import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { InfoCard } from '@/components/InfoCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { db } from '@/lib/supabase';

type MembershipRow = {
  group_id: string;
  role: string;
  groups: { name?: string; join_code?: string } | null;
};

export default function GroupScreen() {
  const queryClient = useQueryClient();
  const [groupName, setGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const membershipsQuery = useQuery<MembershipRow[]>({
    queryKey: ['memberships'],
    queryFn: async () => {
      const { data, error } = await db
        .from('group_members')
        .select('group_id, role, groups(name, join_code)')
        .order('joined_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as MembershipRow[];
    },
  });

  const createGroup = useMutation({
    mutationFn: async () => {
      const { error } = await db.rpc('create_group', {
        p_name: groupName.trim(),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setGroupName('');
      await queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
    onError: (error: Error) =>
      Alert.alert('Could not create group', error.message),
  });

  const joinGroup = useMutation({
    mutationFn: async () => {
      const { error } = await db.rpc('join_group_with_code', {
        p_code: joinCode.trim(),
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setJoinCode('');
      await queryClient.invalidateQueries({ queryKey: ['memberships'] });
    },
    onError: (error: Error) =>
      Alert.alert('Could not join group', error.message),
  });

  const memberships = membershipsQuery.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <Text style={styles.title}>Your group</Text>
      <InfoCard
        title="Create a group"
        subtitle="The creator becomes owner and gets a six-character join code."
      >
        <View style={styles.form}>
          <FormField
            label="Group name"
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Saturday lifters"
          />
          <PrimaryButton
            label="Create"
            onPress={() => createGroup.mutate()}
            loading={createGroup.isPending}
          />
        </View>
      </InfoCard>
      <InfoCard
        title="Join with code"
        subtitle="Codes are trimmed and upper-cased in the RPC before lookup."
      >
        <View style={styles.form}>
          <FormField
            label="Join code"
            value={joinCode}
            onChangeText={setJoinCode}
            placeholder="ABC234"
            autoCapitalize="characters"
          />
          <PrimaryButton
            label="Join group"
            onPress={() => joinGroup.mutate()}
            loading={joinGroup.isPending}
          />
        </View>
      </InfoCard>
      {memberships.map((membership, index) => (
        <InfoCard
          key={`${membership.group_id}-${index}`}
          title={membership.groups?.name ?? 'Group'}
          subtitle={`Code ${membership.groups?.join_code ?? '—'}`}
          rightLabel={membership.role}
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
  form: {
    gap: 12,
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
