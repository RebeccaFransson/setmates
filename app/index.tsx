import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function IndexScreen() {
  const [state, setState] = useState<'loading' | 'auth' | 'onboarding' | 'app'>(
    'loading',
  );

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!isSupabaseConfigured) {
        setState('auth');
        return;
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      if (!session) {
        setState('auth');
        return;
      }

      const { data: profile } = await (supabase as any)
        .from('profiles')
        .select('display_name, unit_preference, bodyweight_kg')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!mounted) return;
      setState(profile?.bodyweight_kg != null ? 'app' : 'onboarding');
    }

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (state === 'loading') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color="#C7F36B" />
        <Text style={styles.text}>Loading Setmates…</Text>
      </View>
    );
  }

  if (state === 'auth') return <Redirect href="/(auth)/sign-in" />;
  if (state === 'onboarding') return <Redirect href="/(onboarding)" />;
  return <Redirect href="/(tabs)/feed" />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    backgroundColor: '#0C111D',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  text: {
    color: '#F8FAFC',
  },
});
