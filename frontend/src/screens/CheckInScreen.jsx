import { useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { checkIn } from '../api';
import { getCurrentAdventure, toScreenStops } from '../data/adventureStore';

const C = { paper: '#FFFEFA', ink: '#173E39', deep: '#12322E', lime: '#D6F65B', pale: '#F0F4D5', muted: '#BDD0C9' };

export default function CheckInScreen() {
  const router = useRouter();
  const adventure = getCurrentAdventure();
  const stops = useMemo(() => toScreenStops(adventure), [adventure]);
  const [completed, setCompleted] = useState(() => new Set(stops.filter(s => s.completed).map(s => s.id)));
  const [viewIndex, setViewIndex] = useState(() => {
    const first = stops.findIndex(s => !s.completed);
    return first === -1 ? Math.max(stops.length - 1, 0) : first;
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!adventure || stops.length === 0) {
    return <SafeAreaView style={styles.emptySafe}>
      <StatusBar style="dark" />
      <Text style={styles.stopTitle}>No quest yet</Text>
      <Text style={styles.description}>Build a quest first, then come back here to check in.</Text>
      <Pressable accessibilityRole="button" onPress={() => router.replace('/')} style={styles.routeButton}>
        <Feather name="arrow-left" size={18} color={C.ink} /><Text style={styles.routeText}>Back to preferences</Text>
      </Pressable>
    </SafeAreaView>;
  }

  const stop = stops[viewIndex];
  const isDone = completed.has(stop.id);
  const isLast = viewIndex === stops.length - 1;
  const remaining = stops.length - completed.size;

  async function doCheckIn() {
    setBusy(true);
    setError(null);
    try {
      // Simulated check-in: send the stop's own coordinates so it works anywhere for the demo
      await checkIn(adventure.adventureId, { stopId: stop.stopId, lat: stop.lat, lng: stop.lng });
      const next = new Set(completed);
      next.add(stop.id);
      setCompleted(next);
    } catch (e) {
      setError(e.message || 'Check-in failed. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function onPrimary() {
    if (!isDone) doCheckIn();
    else if (!isLast) setViewIndex(viewIndex + 1);
    else router.push('/stamp-earned');
  }

  function openRoute() {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}&travelmode=walking`;
    Linking.openURL(url).catch(() => setError('Could not open maps on this phone.'));
  }

  const primaryLabel = !isDone ? 'Check in & collect my stamp' : (!isLast ? 'Next stop' : 'See my stamp');
  const title = isDone ? 'Stop collected!' : 'You made it!';
  const intro = isDone
    ? (isLast ? 'That was the last stop. Your quest stamp is waiting for you.' : `Nice one. ${remaining} ${remaining === 1 ? 'stop' : 'stops'} to go.`)
    : 'Take a moment to look around, then check in to make this stop officially yours.';

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <StatusBar style="light" />
    <SafeAreaView style={styles.body} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.topRow}>
            <Text style={styles.eyebrow}>{`STOP ${viewIndex + 1} OF ${stops.length} \u00b7 FREDERICTON`}</Text>
            <View style={styles.demoBadge}><Text style={styles.demoText}>SIMULATED</Text></View>
          </View>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.intro}>{intro}</Text>
          <View style={styles.radar} accessible accessibilityLabel={isDone ? 'Checked in' : 'Ready to check in'}>
            <View style={styles.ringMiddle}><View style={styles.ringInner}><View style={styles.ringCore}>
              {isDone ? <Feather name="check" size={24} color={C.lime} /> : <View style={styles.dot} />}
            </View></View></View>
            <View style={styles.distance}><Text style={styles.distanceText}>{isDone ? 'Checked in' : 'In the check-in zone'}</Text></View>
          </View>
        </View>
        <View style={styles.cardShadow}><View style={styles.card}>
          <Text accessibilityRole="header" style={styles.stopTitle}>{stop.name}</Text>
          <Text style={styles.description}>{stop.description || 'Take a photo, share a laugh, or simply enjoy the moment.'}</Text>
          <View style={styles.buttonShadow}><Pressable accessibilityRole="button" accessibilityLabel={primaryLabel} disabled={busy} onPress={onPrimary} style={({ pressed }) => [styles.button, isDone && isLast && styles.doneButton, pressed && styles.pressed]}>
            {busy ? <ActivityIndicator color={C.ink} /> : <><Text style={styles.buttonText}>{primaryLabel}</Text><Feather name={isDone && isLast ? 'award' : 'arrow-right'} size={22} color={C.ink} /></>}
          </Pressable></View>
          {error && <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text>}
          <Text style={styles.note}>Simulated check-in for the demo: your location is set to this stop. A quest stamp is earned when every stop is done.</Text>
        </View></View>
        <View style={styles.bottom}>
          <Pressable accessibilityRole="button" onPress={openRoute} style={({ pressed }) => [styles.routeButton, pressed && { opacity: 0.6 }]}>
            <Feather name="navigation" size={17} color={C.ink} /><Text style={styles.routeText}>Show me the route</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => (router.canGoBack() ? router.back() : router.replace('/adventure'))} style={({ pressed }) => [styles.routeButton, pressed && { opacity: 0.6 }]}>
            <Feather name="map" size={17} color={C.ink} /><Text style={styles.routeText}>Back to the adventure</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.deep }, body: { flex: 1, backgroundColor: C.paper }, content: { flexGrow: 1 },
  emptySafe: { flex: 1, backgroundColor: C.paper, padding: 24, justifyContent: 'center', gap: 12 },
  hero: { backgroundColor: C.ink, paddingHorizontal: 24, paddingTop: 25, paddingBottom: 55 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 },
  eyebrow: { color: C.lime, fontSize: 10, letterSpacing: 1.2, flexShrink: 1, lineHeight: 16 },
  demoBadge: { borderWidth: 1, borderColor: '#62866B', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5 }, demoText: { fontSize: 9, letterSpacing: 1, color: C.lime },
  title: { fontSize: 34, fontWeight: '800', color: C.paper, letterSpacing: -1, marginBottom: 11 },
  intro: { fontSize: 15, lineHeight: 23, color: C.muted },
  radar: { width: 228, height: 228, maxWidth: '100%', alignSelf: 'center', borderRadius: 114, borderWidth: 1, borderColor: '#607F43', backgroundColor: '#345B40', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  ringMiddle: { width: 164, height: 164, borderRadius: 82, backgroundColor: '#244A3B', alignItems: 'center', justifyContent: 'center' },
  ringInner: { width: 94, height: 94, borderRadius: 47, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  ringCore: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#496C40', alignItems: 'center', justifyContent: 'center' },
  dot: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.lime },
  distance: { position: 'absolute', bottom: 30, paddingHorizontal: 13, paddingVertical: 10, borderRadius: 22, backgroundColor: C.lime }, distanceText: { color: C.deep, fontSize: 12, fontWeight: '500' },
  cardShadow: { marginTop: -30, marginHorizontal: 24, backgroundColor: C.pale, borderRadius: 25, paddingBottom: 7, paddingRight: 5 },
  card: { backgroundColor: C.paper, borderWidth: 1.8, borderColor: C.deep, borderRadius: 24, padding: 20 },
  stopTitle: { color: C.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.8, marginBottom: 11 },
  description: { color: '#6B817B', fontSize: 14, lineHeight: 21, marginBottom: 21 },
  buttonShadow: { backgroundColor: C.deep, paddingRight: 4, paddingBottom: 5, borderRadius: 23 },
  button: { borderWidth: 1.8, borderColor: C.deep, backgroundColor: C.lime, borderRadius: 22, minHeight: 64, paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  buttonText: { color: C.ink, fontSize: 17, fontWeight: '800', flexShrink: 1, textAlign: 'center' },
  doneButton: { backgroundColor: C.pale }, pressed: { transform: [{ translateX: 2 }, { translateY: 3 }] },
  error: { color: '#B3261E', fontSize: 13, lineHeight: 18, marginTop: 12 },
  note: { color: '#6B817B', fontSize: 11, lineHeight: 16, marginTop: 15 },
  bottom: { flex: 1, minHeight: 100, justifyContent: 'flex-end', alignItems: 'center', paddingVertical: 22, paddingHorizontal: 24 },
  routeButton: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 44, padding: 10 }, routeText: { fontSize: 14, color: C.ink, flexShrink: 1 },
});
