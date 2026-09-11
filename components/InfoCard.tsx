import { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  children?: ReactNode;
  rightLabel?: string;
};

export function InfoCard({ title, subtitle, children, rightLabel }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {rightLabel ? (
          <Text style={styles.rightLabel}>{rightLabel}</Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#182230',
    borderColor: '#344054',
    borderRadius: 20,
    borderWidth: 1,
    gap: 12,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  headerCopy: {
    flex: 1,
    gap: 4,
  },
  rightLabel: {
    alignSelf: 'flex-start',
    backgroundColor: '#C7F36B',
    borderRadius: 999,
    color: '#101828',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  subtitle: {
    color: '#98A2B3',
    fontSize: 13,
  },
  title: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '700',
  },
});
