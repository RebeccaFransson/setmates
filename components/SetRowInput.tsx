import { StyleSheet, Text, TextInput, View } from 'react-native';

import { deltaText, type ExerciseKind } from '@/lib/metrics';

import { DeltaChip } from './DeltaChip';

type SetValue = {
  weightKg?: string;
  reps?: string;
  durationSeconds?: string;
  distanceM?: string;
};

type Props = {
  kind: ExerciseKind;
  label: string;
  value: SetValue;
  previous?: SetValue | null;
  onChange: (next: SetValue) => void;
};

export function SetRowInput({ kind, label, value, previous, onChange }: Props) {
  const delta = deltaText(
    kind,
    {
      kind,
      weightKg: value.weightKg ? Number(value.weightKg) : null,
      reps: value.reps ? Number(value.reps) : null,
      durationSeconds: value.durationSeconds
        ? Number(value.durationSeconds)
        : null,
      distanceM: value.distanceM ? Number(value.distanceM) : null,
    },
    previous
      ? {
          kind,
          weightKg: previous.weightKg ? Number(previous.weightKg) : null,
          reps: previous.reps ? Number(previous.reps) : null,
          durationSeconds: previous.durationSeconds
            ? Number(previous.durationSeconds)
            : null,
          distanceM: previous.distanceM ? Number(previous.distanceM) : null,
        }
      : null,
  );

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputs}>
        {kind === 'weight_reps' || kind === 'weighted_bodyweight' ? (
          <NumericField
            label="kg"
            value={value.weightKg ?? ''}
            placeholder={previous?.weightKg ?? '0'}
            allowNegative={kind === 'weighted_bodyweight'}
            onChangeText={(next) => onChange({ ...value, weightKg: next })}
          />
        ) : null}
        {kind === 'weight_reps' ||
        kind === 'weighted_bodyweight' ||
        kind === 'bodyweight_reps' ? (
          <NumericField
            label="reps"
            value={value.reps ?? ''}
            placeholder={previous?.reps ?? '0'}
            onChangeText={(next) => onChange({ ...value, reps: next })}
          />
        ) : null}
        {kind === 'duration' || kind === 'distance_duration' ? (
          <NumericField
            label="sec"
            value={value.durationSeconds ?? ''}
            placeholder={previous?.durationSeconds ?? '0'}
            onChangeText={(next) =>
              onChange({ ...value, durationSeconds: next })
            }
          />
        ) : null}
        {kind === 'distance_duration' ? (
          <NumericField
            label="m"
            value={value.distanceM ?? ''}
            placeholder={previous?.distanceM ?? '0'}
            onChangeText={(next) => onChange({ ...value, distanceM: next })}
          />
        ) : null}
      </View>
      <DeltaChip text={delta} />
    </View>
  );
}

type NumericFieldProps = {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (text: string) => void;
  allowNegative?: boolean;
};

function NumericField({
  label,
  value,
  placeholder,
  onChangeText,
  allowNegative = false,
}: NumericFieldProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        keyboardType={allowNegative ? 'numbers-and-punctuation' : 'decimal-pad'}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#98A2B3"
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    flex: 1,
    gap: 6,
  },
  fieldLabel: {
    color: '#98A2B3',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: '#101828',
    borderColor: '#344054',
    borderRadius: 12,
    borderWidth: 1,
    color: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputs: {
    flexDirection: 'row',
    gap: 10,
  },
  label: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
  },
  row: {
    backgroundColor: '#0C111D',
    borderRadius: 16,
    gap: 10,
    padding: 12,
  },
});
