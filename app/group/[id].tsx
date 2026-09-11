import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { InfoCard } from '@/components/InfoCard';
import { supabase } from '@/lib/supabase';

type GroupMemberRow = {
  user_id: string;
  role: string;
  displayName: string;
};

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const membersQuery = useQuery<GroupMemberRow[]>({
    queryKey: ['group-members', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data: memberships, error: membershipError } = await (
        supabase as any
      )
        .from('group_members')
        .select('user_id, role')
        .eq('group_id', id)
        .order('joined_at');
      if (membershipError) throw membershipError;

      const userIds = (memberships ?? []).map(
        (member: { user_id: string }) => member.user_id,
      );
      if (userIds.length === 0) return [];

      const { data: profiles, error: profileError } = await (supabase as any)
        .from('profiles')
        .select('id, display_name')
        .in('id', userIds);
      if (profileError) throw profileError;

      const profileById = new Map(
        (profiles ?? []).map(
          (profile: { id: string; display_name: string }) => [
            profile.id,
            profile.display_name,
          ],
        ),
      );
      return (memberships ?? []).map(
        (member: { user_id: string; role: string }) => ({
          user_id: member.user_id,
          role: member.role,
          displayName: profileById.get(member.user_id) ?? 'Member',
        }),
      );
    },
  });

  const members = membersQuery.data ?? [];

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      {members.map((member) => (
        <InfoCard
          key={member.user_id}
          title={member.displayName}
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
