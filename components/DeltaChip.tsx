import { StyleSheet, Text } from 'react-native';

type Props = {
  text: string | null;
};

export function DeltaChip({ text }: Props) {
  if (!text) return null;
  const positive = text.startsWith('+');
  return (
    <Text style={[styles.chip, positive ? styles.positive : styles.negative]}>
      {text}
    </Text>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  negative: {
    backgroundColor: '#FEF3F2',
    color: '#B54708',
  },
  positive: {
    backgroundColor: '#ECFDF3',
    color: '#027A48',
  },
});
