import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import Motion from '../components/Motion';
import PhotoMemoryPicker from '../components/PhotoMemoryPicker';
import { checkIn, getAdventure } from '../api';
import { getCurrentAdventure, setCurrentAdventure, toScreenStops } from '../data/adventureStore';

const C = { paper: '#FFFDFA', ink: '#173E39', deep: '#12322E', lime: '#D1FF4A', pale: '#F0F4D5', muted: '#BDD0C9' };

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
  const [completionConfirmed, setCompletionConfirmed] = useState(false);
  const pending = useRef(false);

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
  const allComplete = stops.every(item => completed.has(item.id));

  async function doCheckIn() {
    if (pending.current) return;
    pending.current = true;
    setBusy(true);
    setError(null);
    setCompletionConfirmed(false);
    try {
      // Simulated check-in: send the stop's own coordinates so it works anywhere for the demo
      if (!isDone) {
        const result = await checkIn(adventure.adventureId, { stopId: stop.stopId, lat: stop.lat, lng: stop.lng });
        if (result?.success !== true || result.stopId !== stop.stopId) {
          throw new Error('The backend did not confirm this check-in. Please try again.');
        }
      }
      // Confirm saved flags before offering the stamp, and preserve them on return.
      const saved = await getAdventure(adventure.adventureId);
      if (!Array.isArray(saved.stops) || saved.stops.length === 0) {
        throw new Error('Unable to confirm saved progress. Please try again.');
      }
      setCurrentAdventure({ ...saved, travel: adventure.travel, preferences: adventure.preferences });
      setCompleted(new Set(saved.stops.filter(item => item.completed).map(item => item.stopId)));
      setCompletionConfirmed(saved.stops.every(item => item.completed === true));
    } catch (e) {
      setError(e.message || 'Check-in failed. Try again.');
    } finally {
      pending.current = false;
      setBusy(false);
    }
  }

  function onPrimary() {
    if (pending.current) return;
    if (allComplete && completionConfirmed) {
      router.push({ pathname: '/stamp-earned', params: { adventureId: adventure.adventureId } });
    } else if (!isDone || allComplete) doCheckIn();
    else setViewIndex(stops.findIndex(item => !completed.has(item.id)));
  }

  function openRoute() {
    const modes = { walk: 'walking', bike: 'bicycling', drive: 'driving' };
    const mode = modes[String(adventure.travel || '').toLowerCase()] || 'walking';
    // No origin given: Google Maps starts from the phone's current location
    const url = `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}&travelmode=${mode}`;
    Linking.openURL(url).catch(() => setError('Could not open maps on this phone.'));
  }

  const primaryLabel = allComplete && completionConfirmed ? 'See my stamp'
    : allComplete ? 'Confirm saved completion' : !isDone ? 'Check in at this stop' : 'Next stop';
  const title = isDone ? 'Stop collected!' : 'You made it!';
  const intro = isDone
    ? (allComplete && completionConfirmed ? 'Every stop is complete. Your quest stamp is waiting for you.' : `Nice one. ${remaining} ${remaining === 1 ? 'stop' : 'stops'} to go.`)
    : 'Take a moment to look around, then check in to make this stop officially yours.';

  return <SafeAreaView style={styles.safe} edges={['top']}>
    <StatusBar style="light" />
    <SafeAreaView style={styles.body} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.topRow}>
            <Text style={styles.eyebrow}>{`STOP ${viewIndex + 1} OF ${stops.length} \u00b7 ${(adventure.preferences?.city || 'Fredericton').toUpperCase()}`}</Text>
            <View style={styles.demoBadge}><Text style={styles.demoText}>SIMULATED</Text></View>
          </View>
          <Text accessibilityRole="header" style={styles.title}>{title}</Text>
          <Text style={styles.intro}>{intro}</Text>
          <View style={styles.radar} accessible accessibilityLabel={isDone ? 'Checked in' : 'Ready to check in'}>
            <View style={styles.ringMiddle}><View style={styles.ringInner}><View style={styles.ringCore}>
              {isDone ? <Feather name="check" size={24} color={C.lime} /> : <Motion pulse style={styles.dot} />}
            </View></View></View>
            <View style={styles.distance}><Text style={styles.distanceText}>{isDone ? 'Checked in' : 'Demo check-in'}</Text></View>
          </View>
        </View>
        <View style={styles.cardShadow}><View style={styles.card}>
          <Text accessibilityRole="header" style={styles.stopTitle}>{stop.name}</Text>
          <Text style={styles.description}>{stop.description || 'Take a photo, share a laugh, or simply enjoy the moment.'}</Text>
          <PhotoMemoryPicker key={`${adventure.adventureId}:${stop.stopId}`} adventureId={adventure.adventureId} stopId={stop.stopId} title={stop.name} />
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
  hero: { backgroundColor: C.ink, paddingHorizontal: 24, paddingTop: 32, paddingBottom: 55 },
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
  cardShadow: { marginTop: -30, marginHorizontal: 24, borderRadius: 26, shadowColor: C.deep, shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  card: { backgroundColor: C.paper, borderWidth: 1, borderColor: '#D5DEDA', borderRadius: 26, padding: 22 },
  stopTitle: { color: C.ink, fontSize: 27, fontWeight: '800', letterSpacing: -0.8, marginBottom: 11 },
  description: { color: '#6B817B', fontSize: 14, lineHeight: 21, marginBottom: 21 },
  buttonShadow: { borderRadius: 23 },
  button: { backgroundColor: C.lime, borderRadius: 23, minHeight: 64, paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9 },
  buttonText: { color: C.ink, fontSize: 17, fontWeight: '800', flexShrink: 1, textAlign: 'center' },
  doneButton: { backgroundColor: C.pale }, pressed: { transform: [{ translateX: 2 }, { translateY: 3 }] },
  error: { color: '#B3261E', fontSize: 13, lineHeight: 18, marginTop: 12 },
  note: { color: '#6B817B', fontSize: 11, lineHeight: 16, marginTop: 15 },
  bottom: { flex: 1, minHeight: 100, justifyContent: 'flex-end', alignItems: 'center', paddingVertical: 22, paddingHorizontal: 24 },
  routeButton: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 44, padding: 10 }, routeText: { fontSize: 14, color: C.ink, flexShrink: 1 },
});

