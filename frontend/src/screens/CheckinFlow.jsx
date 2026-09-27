import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import adventure from '../data/mockCheckinAdventure.json';

const MOCK_DISTANCE_METERS = 32;
const C = { ink: '#173E39', dark: '#12322E', lime: '#D6F65B', paper: '#FFFEFA', pale: '#F0F4D5', muted: '#6B817B', light: '#C1D1CC' };

function createInitialStops() {
  // Copy the sample data so checking in never changes the imported object.
  return adventure.stops.map(stop => ({ ...stop, completed: false }));
}

export default function CheckinFlow() {
  const router = useRouter();
  const [stops, setStops] = useState(createInitialStops);
  const [lastCompletedName, setLastCompletedName] = useState('');

  // Derive progress from the stops instead of storing a separate counter.
  const completedCount = stops.filter(stop => stop.completed).length;
  const currentStop = stops.find(stop => !stop.completed);
  const adventureComplete = stops.length > 0 && completedCount === stops.length;

  function simulateCheckIn() {
    if (!currentStop) return;
    // Reuse the old check-in screen's immutable update, with no API request.
    setStops(previousStops => previousStops.map(stop =>
      stop.stopId === currentStop.stopId ? { ...stop, completed: true } : stop
    ));
    setLastCompletedName(currentStop.name);
  }

  function resetDemo() {
    setStops(createInitialStops());
    setLastCompletedName('');
  }

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.topRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack}
              style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
              <Feather name="arrow-left" size={22} color={C.paper} />
            </Pressable>
            <Text style={styles.demoBadge}>MOCK ADVENTURE</Text>
          </View>
          <Text style={styles.eyebrow}>
            {currentStop ? `STOP ${currentStop.order} OF ${stops.length} · ${currentStop.category.toUpperCase()}` : 'ALL STOPS COMPLETED'}
          </Text>
          <Text style={styles.title}>{adventureComplete ? 'You did it!' : 'You made it!'}</Text>
          <Text style={styles.intro}>
            {adventureComplete
              ? 'Your practice adventure is complete. Reset the demo to try again.'
              : 'Try a check-in at this stop. This preview uses sample data, so you can explore the flow from anywhere.'}
          </Text>
          <View style={styles.zone}>
            <View style={styles.innerZone}>
              <View style={styles.centerZone}>
                <Feather name={adventureComplete ? 'check' : 'map-pin'} size={30} color={C.lime} />
              </View>
            </View>
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{adventureComplete ? 'Demo complete' : `${MOCK_DISTANCE_METERS} m away · mock`}</Text>
            </View>
          </View>
          <Text style={styles.zoneNote}>Demo only · GPS is not connected</Text>
        </View>

        <View style={styles.body}>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>{adventureComplete ? 'ADVENTURE COMPLETE' : 'CURRENT STOP'}</Text>
            <Text style={styles.stopTitle}>{currentStop ? currentStop.name : adventure.title}</Text>
            {currentStop && <Text style={styles.metadata}>{currentStop.category} · {currentStop.estimatedMinutes} min at this stop</Text>}
            <Text style={styles.description}>
              {currentStop ? currentStop.description : 'All stops are checked in locally. No stamp has been created or saved yet.'}
            </Text>
            {lastCompletedName !== '' && (
              <Text accessibilityLiveRegion="polite" style={styles.confirmation}>
                ✓ {lastCompletedName} checked in (simulated).
              </Text>
            )}
            <View style={styles.buttonShadow}>
              <Pressable accessibilityRole="button" onPress={adventureComplete ? resetDemo : simulateCheckIn}
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
                <Text style={styles.primaryText}>{adventureComplete ? 'Try the demo again' : 'Simulate check-in'}</Text>
                <Feather name={adventureComplete ? 'rotate-ccw' : 'arrow-right'} size={22} color={C.ink} />
              </Pressable>
            </View>
            <Text style={styles.temporaryNote}>Temporary demo · progress stays on this screen only</Text>
          </View>

          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Your adventure</Text>
            <Text accessibilityLiveRegion="polite" style={styles.progressText}>{completedCount} of {stops.length} complete</Text>
          </View>
          <Text style={styles.adventureTitle}>{adventure.title}</Text>
          <View accessibilityRole="progressbar" accessibilityLabel="Adventure progress"
            accessibilityValue={{ min: 0, max: stops.length, now: completedCount }} style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${completedCount / stops.length * 100}%` }]} />
          </View>
          {stops.map(stop => {
            const isCurrent = stop.stopId === currentStop?.stopId;
            const status = stop.completed ? 'Completed' : isCurrent ? 'Current stop' : 'Not started';
            return (
              <View key={stop.stopId} style={[styles.stopRow, isCurrent && styles.currentRow]}>
                <View style={[styles.stopNumber, stop.completed && styles.completedNumber]}>
                  {stop.completed ? <Feather name="check" size={18} color={C.ink} /> : <Text style={styles.numberText}>{stop.order}</Text>}
                </View>
                <View style={styles.stopSummary}>
                  <Text style={styles.stopName}>{stop.name}</Text>
                  <Text style={styles.stopStatus}>{status}</Text>
                </View>
              </View>
            );
          })}
          {!adventureComplete && (
            <Pressable accessibilityRole="button" onPress={resetDemo} style={({ pressed }) => [styles.resetButton, pressed && styles.pressed]}>
              <Text style={styles.resetText}>Reset demo progress</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.dark },
  scroll: { flex: 1, backgroundColor: C.paper },
  content: { flexGrow: 1 },
  hero: { backgroundColor: C.ink, paddingHorizontal: 24, paddingTop: 12, paddingBottom: 48 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  demoBadge: { color: C.lime, fontSize: 10, fontWeight: '700', letterSpacing: 1.5 },
  eyebrow: { color: C.lime, fontSize: 12, letterSpacing: 1.5, marginBottom: 12 },
  title: { color: C.paper, fontSize: 36, fontWeight: '800', marginBottom: 10 },
  intro: { color: C.light, fontSize: 16, lineHeight: 24 },
  zone: { width: 220, height: 220, borderRadius: 110, backgroundColor: '#355A3E', borderWidth: 1, borderColor: '#50764D', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  innerZone: { width: 156, height: 156, borderRadius: 78, backgroundColor: '#244C3E', alignItems: 'center', justifyContent: 'center' },
  centerZone: { width: 88, height: 88, borderRadius: 44, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  distanceBadge: { position: 'absolute', bottom: 22, borderRadius: 24, backgroundColor: C.lime, paddingHorizontal: 16, paddingVertical: 12 },
  distanceText: { color: C.ink, fontSize: 13, fontWeight: '600' },
  zoneNote: { textAlign: 'center', color: C.light, fontSize: 12, marginTop: 12 },
  body: { paddingHorizontal: 20, paddingBottom: 24 },
  card: { marginTop: -24, backgroundColor: C.paper, borderWidth: 2, borderColor: C.ink, borderRadius: 24, padding: 20 },
  cardLabel: { color: C.muted, fontSize: 10, letterSpacing: 1.5, fontWeight: '700', marginBottom: 8 },
  stopTitle: { color: C.ink, fontSize: 27, fontWeight: '800' },
  metadata: { color: C.muted, fontSize: 13, marginTop: 8, textTransform: 'capitalize' },
  description: { color: C.muted, fontSize: 15, lineHeight: 22, marginTop: 12, marginBottom: 20 },
  confirmation: { color: C.ink, backgroundColor: C.pale, borderRadius: 12, padding: 12, marginBottom: 16, fontSize: 14, lineHeight: 20 },
  buttonShadow: { backgroundColor: C.dark, borderRadius: 23, paddingRight: 4, paddingBottom: 5 },
  primaryButton: { minHeight: 60, borderRadius: 22, borderWidth: 2, borderColor: C.ink, backgroundColor: C.lime, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  primaryText: { color: C.ink, fontSize: 18, fontWeight: '800', flexShrink: 1 },
  pressed: { opacity: 0.7 },
  temporaryNote: { color: C.muted, fontSize: 11, textAlign: 'center', marginTop: 12, lineHeight: 17 },
  progressHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 28 },
  sectionTitle: { color: C.ink, fontSize: 19, fontWeight: '700' },
  progressText: { color: C.ink, fontSize: 13 },
  adventureTitle: { color: C.muted, fontSize: 13, marginTop: 8, marginBottom: 16 },
  progressTrack: { height: 8, backgroundColor: C.pale, borderRadius: 4, overflow: 'hidden', marginBottom: 16 },
  progressFill: { height: '100%', backgroundColor: C.ink, borderRadius: 4 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderWidth: 1, borderColor: 'transparent', borderRadius: 16, marginBottom: 6 },
  currentRow: { backgroundColor: C.pale, borderColor: C.ink },
  stopNumber: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: C.ink, alignItems: 'center', justifyContent: 'center' },
  completedNumber: { backgroundColor: C.lime },
  numberText: { color: C.ink, fontWeight: '600' },
  stopSummary: { flex: 1 },
  stopName: { color: C.ink, fontSize: 15, fontWeight: '600' },
  stopStatus: { color: C.muted, fontSize: 12, marginTop: 4 },
  resetButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  resetText: { color: C.ink, fontSize: 14, textDecorationLine: 'underline' },
});
