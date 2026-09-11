import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nothing here.</Text>
      <Link href="/" style={styles.link}>
        Back to Setmates
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#0C111D',
    flex: 1,
    gap: 12,
    justifyContent: 'center',
  },
  link: {
    color: '#C7F36B',
    fontWeight: '700',
  },
  title: {
    color: '#F8FAFC',
    fontSize: 24,
    fontWeight: '800',
  },
});
