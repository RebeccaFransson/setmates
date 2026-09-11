import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Missing env',
        'Add the Supabase URL and anon key to .env before signing in.',
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign in failed', error.message);
      return;
    }

    router.replace('/');
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Setmates</Text>
        <Text style={styles.title}>
          Train together, even when you lift apart.
        </Text>
        <Text style={styles.subtitle}>
          Email + password in, then create or join a private group.
        </Text>
      </View>
      <View style={styles.form}>
        <FormField
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <FormField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />
        <PrimaryButton
          label="Sign in"
          onPress={handleSignIn}
          loading={loading}
        />
        <Link href="/(auth)/sign-up" style={styles.link}>
          Need an account? Sign up.
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: 24,
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    gap: 16,
  },
  hero: {
    gap: 8,
  },
  kicker: {
    color: '#C7F36B',
    fontSize: 16,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  link: {
    color: '#C7F36B',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  screen: {
    backgroundColor: '#0C111D',
  },
  subtitle: {
    color: '#98A2B3',
    fontSize: 16,
    lineHeight: 24,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
});
