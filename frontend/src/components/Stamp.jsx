import { StyleSheet, Text, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

// Display only: this component never creates or saves a stamp.
export default function Stamp({ title, stopCount, earnedAt, compact = false, index = 0 }) {
  const date = earnedAt ? new Date(earnedAt) : null;
  const dateLabel = date && !Number.isNaN(date.getTime())
    ? date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Date unavailable';

  const tint = ['#E5F5EF', '#FFF0E9', '#F1F7D6', '#EEEAF8'][index % 4];
  if (compact) return (
    <View style={compactStyles.card}>
      <View style={[compactStyles.shadow, { backgroundColor: tint }]}>
        <View style={[compactStyles.seal, { backgroundColor: tint, transform: [{ rotate: index % 2 ? '7deg' : '-7deg' }] }]}>
          <View style={compactStyles.tape} />
          <View style={compactStyles.inner}>
            <Text numberOfLines={2} style={compactStyles.label}>{title.toUpperCase()}</Text>
            <Feather name={['wind', 'coffee', 'feather', 'heart'][index % 4]} size={26} color="#173E39" />
            <Text style={compactStyles.date}>{dateLabel}</Text>
          </View>
        </View>
      </View>
      <Text style={compactStyles.title}>{title}</Text>
      <Text style={compactStyles.details}>{stopCount} {stopCount === 1 ? 'stop' : 'stops'} completed</Text>
    </View>
  );

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

const compactStyles = StyleSheet.create({
  card: { width: '47%', alignItems: 'center', marginVertical: 14 },
  shadow: { width: '90%', maxWidth: 142, aspectRatio: 1, borderRadius: 100, paddingRight: 4, paddingBottom: 4 },
  seal: { width: '100%', height: '100%', borderRadius: 100, borderWidth: 1, borderColor: '#173E39', padding: 12 },
  inner: { flex: 1, borderWidth: 1, borderColor: '#173E39', borderRadius: 100, alignItems: 'center', justifyContent: 'space-evenly', padding: 7 },
  tape: { position: 'absolute', width: 34, height: 12, alignSelf: 'center', top: -7, backgroundColor: '#D1FF4A88' },
  label: { color: '#173E39', fontSize: 8, letterSpacing: 0.5, textAlign: 'center' }, date: { color: '#173E39', fontSize: 8, textAlign: 'center' },
  title: { color: '#173E39', fontSize: 12, fontWeight: '600', textAlign: 'center', lineHeight: 17, marginTop: 12 }, details: { color: '#6B817B', fontSize: 10, textAlign: 'center', marginTop: 4 },
});
