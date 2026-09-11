import { Link, router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    if (!isSupabaseConfigured) {
      Alert.alert(
        'Missing env',
        'Add the Supabase URL and anon key to .env before signing up.',
      );
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { name: name.trim() } },
    });
    setLoading(false);

    if (error) {
      Alert.alert('Sign up failed', error.message);
      return;
    }

    router.replace('/(onboarding)');
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.form}>
        <Text style={styles.title}>Create your Setmates account</Text>
        <FormField
          label="Name"
          value={name}
          onChangeText={setName}
          placeholder="Rebecca"
        />
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
          label="Sign up"
          onPress={handleSignUp}
          loading={loading}
        />
        <Link href="/(auth)/sign-in" style={styles.link}>
          Already lifting with us? Sign in.
        </Link>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  form: {
    gap: 16,
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
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
});
