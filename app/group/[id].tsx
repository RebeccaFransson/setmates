import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { InfoCard } from '@/components/InfoCard';
import { db } from '@/lib/supabase';

type GroupMemberRow = {
  role: string;
  profiles: { display_name?: string } | null;
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const membersQuery = useQuery<GroupMemberRow[]>({
    queryKey: ['group-members', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await db
        .from('group_members')
        .select('role, profiles(display_name)')
        .eq('group_id', id)
        .order('joined_at');
      if (error) throw error;
      return (data ?? []) as GroupMemberRow[];
    },
  });

  const members = membersQuery.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      {members.map((member, index) => (
        <InfoCard
          key={index}
          title={member.profiles?.display_name ?? 'Member'}
          subtitle="Visible because you share this group"
          rightLabel={member.role}
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
});
