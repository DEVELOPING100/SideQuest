import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import AdventureMap from '../components/AdventureMap';
import { generateAdventure, getAdventure } from '../api';
import { setCurrentAdventure, toScreenStops } from '../data/adventureStore';

const C = { paper: '#FFFEFA', ink: '#173E39', lime: '#D6F65B', pale: '#F0F4D5', muted: '#6B817B', line: '#D9E0D6', shadow: '#12322E' };
const FREDERICTON = { lat: 45.9636, lng: -66.6431 };
function single(value, fallback) { return typeof value === 'string' ? value : fallback; }
function positive(value, fallback) { const n = Number(value); return Number.isFinite(n) && n > 0 ? n : fallback; }
function nonNegative(value, fallback) { const n = Number(value); return Number.isFinite(n) && n >= 0 ? n : fallback; }

export default function AdventureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [favorite, setFavorite] = useState(false);
  const minutes = single(params.minutes, '90');
  const budget = single(params.budget, '25');
  const group = single(params.groupSize, '2');
  const vibes = single(params.vibes, 'Romance + Relax / chill') || 'Open to any vibe';
  const travel = single(params.travel, 'Walk');

  const [adventure, setAdventure] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function build() {
      setLoading(true);
      setError(null);
      try {
        const created = await generateAdventure({
          mode: 'ai',
          lat: FREDERICTON.lat,
          lng: FREDERICTON.lng,
          budget: nonNegative(budget, 25),
          timeMinutes: positive(minutes, 90),
          groupSize: positive(group, 2),
        });
        let full = created;
        try {
          full = await getAdventure(created.adventureId);
        } catch {
          // Keep the generate response if the detail call fails
        }
        if (cancelled) return;
        setAdventure(full);
        setStops(toScreenStops(full));
        setCurrentAdventure({ ...full, travel });
      } catch (e) {
        if (!cancelled) setError(e.message || 'Something went wrong.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    build();
    return () => { cancelled = true; };
  }, [attempt]);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  const ready = !loading && !error && adventure;

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to preferences" onPress={goBack} style={({ pressed }) => [styles.circle, pressed && styles.pressed]}><Feather name="chevron-left" size={23} color={C.ink} /></Pressable>
      <Text accessibilityRole="header" style={styles.headerTitle}>{ready ? 'Your quest is ready!' : 'Building your quest...'}</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={favorite ? 'Remove favorite' : 'Favorite this quest'} accessibilityState={{ selected: favorite }} onPress={() => setFavorite(v => !v)} style={({ pressed }) => [styles.circle, favorite && styles.favorite, pressed && styles.pressed]}><Feather name="heart" size={22} color={C.ink} /></Pressable>
    </View>
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.stats}>
        {[[`${minutes} min`, 'YOUR TIME'], [`${group} ${group === '1' ? 'person' : 'people'}`, 'YOUR CREW'], [`$${budget}`, 'BUDGET \u00b7 CAD']].map(([value, label]) => <View key={label} style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>)}
      </View>

      {loading && <View style={styles.status}>
        <ActivityIndicator size="large" color={C.ink} />
        <Text style={styles.statusTitle}>Planning your quest...</Text>
        <Text style={styles.statusText}>Picking real places that fit your time and budget.</Text>
      </View>}

      {!loading && error && <View style={styles.status}>
        <Text style={styles.statusTitle}>Couldn't build your quest</Text>
        <Text style={styles.statusText}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={() => setAttempt(a => a + 1)} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}><Text style={styles.retryText}>Try again</Text></Pressable>
      </View>}

      {ready && <>
        <AdventureMap stops={stops} travel={travel} />
        <View style={styles.card}>
          <Text style={styles.eyebrow}>{vibes.toUpperCase()}</Text>
          <Text accessibilityRole="header" style={styles.title}>{adventure.title}</Text>
          <Text style={styles.description}>{`${stops.length} real stops, about ${adventure.totalEstimatedMinutes} min including walking between them.`}</Text>
          {stops.map((stop, index) => <View key={stop.id} style={styles.stop}>
            <View style={styles.number}><Text style={styles.numberText}>{index + 1}</Text></View>
            <View style={styles.stopCopy}><Text style={styles.stopName}>{stop.name}</Text><Text style={styles.stopDetail}>{stop.detail}</Text></View>
            <Text style={styles.duration}>{stop.minutes} min</Text>
          </View>)}
          <Text style={styles.mode}>{`Fredericton, NB \u00b7 ${travel} selected`}</Text>
          {favorite && <Text accessibilityLiveRegion="polite" style={styles.favoriteNote}>Saved to favorites for this session.</Text>}
        </View>
      </>}
    </ScrollView>
    <View style={styles.footer}><View style={styles.shadow}>
      <Pressable accessibilityRole="button" accessibilityLabel="Let's go, start check-in" disabled={!ready} onPress={() => router.push('/check-in')} style={({ pressed }) => [styles.primary, !ready && styles.disabled, pressed && styles.primaryPressed]}><Text style={styles.primaryText}>Let's go</Text><Feather name="arrow-right" size={23} color={C.ink} /></Pressable>
    </View></View>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper }, flex: { flex: 1 }, content: { paddingBottom: 16 },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  circle: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.8, borderColor: C.ink, backgroundColor: C.pale, justifyContent: 'center', alignItems: 'center', shadowColor: C.shadow, shadowOffset: { width: 2, height: 3 }, shadowOpacity: 0.22, shadowRadius: 0 },
  favorite: { backgroundColor: C.lime }, pressed: { opacity: 0.65 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '500', color: C.ink },
  stats: { flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingBottom: 18 },
  stat: { flex: 1, borderWidth: 1.8, borderColor: C.ink, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 15, minHeight: 78, justifyContent: 'space-between', gap: 9 },
  statValue: { fontSize: 17, fontWeight: '800', color: C.ink }, statLabel: { fontSize: 9, letterSpacing: 0.6, color: C.muted },
  status: { marginHorizontal: 24, marginTop: 40, alignItems: 'center', gap: 12 },
  statusTitle: { color: C.ink, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  statusText: { color: C.muted, fontSize: 14, lineHeight: 21, textAlign: 'center' },
  retry: { marginTop: 8, borderWidth: 1.8, borderColor: C.ink, borderRadius: 18, backgroundColor: C.lime, paddingHorizontal: 22, paddingVertical: 12 },
  retryText: { color: C.ink, fontSize: 16, fontWeight: '800' },
  card: { marginHorizontal: 24, marginTop: 16, paddingHorizontal: 18, paddingTop: 25, borderTopWidth: 1.5, borderColor: C.ink, borderTopLeftRadius: 29, borderTopRightRadius: 29, backgroundColor: C.paper },
  eyebrow: { color: C.ink, fontSize: 10, letterSpacing: 1.5, lineHeight: 17, marginBottom: 13 },
  title: { color: C.ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.8, marginBottom: 11 },
  description: { color: C.muted, fontSize: 15, lineHeight: 23, marginBottom: 4 },
  stop: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: C.line },
  number: { width: 38, height: 40, borderRadius: 11, borderWidth: 1.6, borderColor: C.ink, backgroundColor: C.lime, justifyContent: 'center', alignItems: 'center' },
  numberText: { color: C.ink, fontSize: 15, fontWeight: '500' }, stopCopy: { flex: 1 },
  stopName: { fontSize: 14, color: C.ink, marginBottom: 6, lineHeight: 19 }, stopDetail: { fontSize: 11, color: C.muted, lineHeight: 16 },
  duration: { color: C.ink, fontSize: 12 },
  mode: { color: C.muted, fontSize: 11, marginTop: 12 }, favoriteNote: { color: C.ink, fontSize: 11, marginTop: 10 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12, backgroundColor: C.paper },
  shadow: { backgroundColor: C.shadow, borderRadius: 24, paddingBottom: 5, paddingRight: 4 },
  primary: { backgroundColor: C.lime, borderWidth: 1.8, borderColor: C.ink, borderRadius: 23, minHeight: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 15 },
  disabled: { opacity: 0.5 },
  primaryPressed: { transform: [{ translateX: 2 }, { translateY: 3 }] }, primaryText: { fontSize: 20, fontWeight: '800', color: C.ink, letterSpacing: -0.5 },
});


