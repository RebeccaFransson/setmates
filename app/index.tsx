import { Redirect } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';

import { resolveAppRoute } from '@/lib/auth-route';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function IndexScreen() {
  const [state, setState] = useState<
    'loading' | 'auth' | 'onboarding' | 'app' | 'error'
  >('loading');
  const [errorMessage, setErrorMessage] = useState('');

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

      const { data: profile, error } = await (supabase as any)
        .from('profiles')
        .select('display_name, unit_preference, bodyweight_kg')
        .eq('id', session.user.id)
        .maybeSingle();

      if (!mounted) return;
      if (error) {
        setErrorMessage(error.message);
        setState(
          resolveAppRoute({
            isConfigured: true,
            hasSession: true,
            hasProfileError: true,
            bodyweightKg: null,
          }),
        );
        return;
      }

      setState(
        resolveAppRoute({
          isConfigured: true,
          hasSession: true,
          hasProfileError: false,
          bodyweightKg: profile?.bodyweight_kg,
        }),
      );
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

  if (state === 'error') {
    return (
      <View style={styles.loading}>
        <Text style={styles.text}>Could not load your profile.</Text>
        <Text style={styles.error}>{errorMessage}</Text>
      </View>
    );
  }

  if (state === 'auth') return <Redirect href="/(auth)/sign-in" />;
  if (state === 'onboarding') return <Redirect href="/(onboarding)" />;
  return <Redirect href="/(tabs)/feed" />;
}

const styles = StyleSheet.create({
  error: {
    color: '#F97066',
    textAlign: 'center',
  },
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
