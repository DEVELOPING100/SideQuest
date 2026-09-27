import { StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

// Display only: this component never creates or saves a stamp.
export default function Stamp({ title, stopCount, earnedAt }) {
  const date = earnedAt ? new Date(earnedAt) : null;
  const dateLabel = date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Date unavailable';

  return (
    <View style={styles.card}>
      <View style={styles.seal}>
        <View style={styles.innerSeal}>
          <Text style={styles.label}>SIDEQUEST</Text>
          <Feather name="compass" size={32} color="#173E39" />
          <Text style={styles.earned}>ADVENTURE COMPLETE</Text>
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.details}>{stopCount} {stopCount === 1 ? 'stop' : 'stops'} completed</Text>
      <Text style={styles.date}>Earned {dateLabel}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', padding: 18, borderBottomWidth: 1, borderColor: '#D9E0D6', gap: 8 },
  seal: { width: 156, minHeight: 156, borderRadius: 78, borderWidth: 1.5, borderColor: '#173E39', padding: 4, backgroundColor: '#F0F4D5' },
  innerSeal: { flex: 1, borderRadius: 74, borderWidth: 1, borderColor: '#173E39', alignItems: 'center', justifyContent: 'center', padding: 18, gap: 10 },
  label: { color: '#173E39', fontSize: 10, letterSpacing: 2, fontWeight: '600', textAlign: 'center' },
  earned: { color: '#173E39', fontSize: 9, letterSpacing: 1, textAlign: 'center' },
  title: { color: '#173E39', fontSize: 19, fontWeight: '700', textAlign: 'center', marginTop: 8 },
  details: { color: '#173E39', fontSize: 14, textAlign: 'center' },
  date: { color: '#6B817B', fontSize: 12, textAlign: 'center' },
});
