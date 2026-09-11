import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

type Props = {
  label: string;
  onPress?: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: 'primary' | 'secondary';
};

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  tone = 'primary',
}: Props) {
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        tone === 'secondary' ? styles.secondary : styles.primary,
        disabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color="#101828" />
      ) : (
        <Text style={styles.label}>{label}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: 14,
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    color: '#101828',
    fontSize: 16,
    fontWeight: '700',
  },
  primary: {
    backgroundColor: '#C7F36B',
  },
  secondary: {
    backgroundColor: '#EAECF0',
  },
});
