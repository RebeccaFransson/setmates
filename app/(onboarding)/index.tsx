import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormField } from '@/components/FormField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { supabase } from '@/lib/supabase';

export default function OnboardingScreen() {
  const [displayName, setDisplayName] = useState('');
  const [unitPreference, setUnitPreference] = useState<'metric' | 'imperial'>(
    'metric',
  );
  const [bodyweightKg, setBodyweightKg] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSave() {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      router.replace('/(auth)/sign-in');
      return;
    }

    const { error } = await (supabase as any).from('profiles').upsert({
      id: session.user.id,
      display_name: displayName.trim() || 'Lifter',
      unit_preference: unitPreference,
      bodyweight_kg: bodyweightKg
        ? Number(bodyweightKg.replace(',', '.'))
        : null,
    });

    setLoading(false);

    if (error) {
      Alert.alert('Could not save', error.message);
      return;
    }

    router.replace('/');
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.screen}>
      <View style={styles.form}>
        <Text style={styles.title}>Finish your profile</Text>
        <Text style={styles.subtitle}>
          We snapshot bodyweight when a workout starts so old sessions stay
          historically correct.
        </Text>
        <FormField
          label="Display name"
          value={displayName}
          onChangeText={setDisplayName}
        />
        <FormField
          label="Bodyweight (kg)"
          value={bodyweightKg}
          onChangeText={setBodyweightKg}
          keyboardType="decimal-pad"
        />
        <View style={styles.toggleRow}>
          <PrimaryButton
            label="Metric"
            onPress={() => setUnitPreference('metric')}
            tone={unitPreference === 'metric' ? 'primary' : 'secondary'}
          />
          <PrimaryButton
            label="Imperial"
            onPress={() => setUnitPreference('imperial')}
            tone={unitPreference === 'imperial' ? 'primary' : 'secondary'}
          />
        </View>
        <PrimaryButton
          label="Save profile"
          onPress={handleSave}
          loading={loading}
        />
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
  screen: {
    backgroundColor: '#0C111D',
  },
  subtitle: {
    color: '#98A2B3',
    fontSize: 15,
    lineHeight: 22,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 28,
    fontWeight: '800',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 12,
  },
});
