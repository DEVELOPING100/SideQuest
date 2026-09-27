import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { SAMPLE_STOPS } from '../data/sampleAdventure';

const C = { paper: '#FFFEFA', ink: '#173E39', deep: '#12322E', lime: '#D6F65B', pale: '#F0F4D5', muted: '#BDD0C9' };

export default function CheckInScreen() {
  const router = useRouter();
  const [checkedIn, setCheckedIn] = useState(false);
  const stop = SAMPLE_STOPS[0];
  function showRoute() {
    if (router.canGoBack()) router.back();
    else router.replace('/adventure');
  }
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <StatusBar style="light" />
    <SafeAreaView style={styles.body} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.topRow}>
            <Text style={styles.eyebrow}>STOP 1 OF {SAMPLE_STOPS.length} · FREDERICTON</Text>
            <View style={styles.demoBadge}><Text style={styles.demoText}>DEMO</Text></View>
          </View>
          <Text accessibilityRole="header" style={styles.title}>{checkedIn ? 'A little moment, yours.' : 'You made it!'}</Text>
          <Text style={styles.intro}>{checkedIn ? 'Your demo check-in is complete. Take a moment to enjoy this little corner of the city.' : 'A little fresh air, a new perspective. Take a moment to look around and make this stop yours.'}</Text>
          <View style={styles.radar} accessible accessibilityLabel={checkedIn ? 'Demo check-in complete. Location was not verified.' : 'Illustrative proximity display. GPS is not connected.'}>
            <View style={styles.ringMiddle}><View style={styles.ringInner}><View style={styles.ringCore}>
              {checkedIn ? <Feather name="check" size={24} color={C.lime} /> : <View style={styles.dot} />}
            </View></View></View>
            <View style={styles.distance}><Text style={styles.distanceText}>{checkedIn ? 'Demo check-in complete' : 'Location preview'}</Text></View>
          </View>
        </View>
        <View style={styles.cardShadow}><View style={styles.card}>
          <Text accessibilityRole="header" style={styles.stopTitle}>{stop.name}</Text>
          <Text style={styles.description}>Take a photo, share a laugh, or simply enjoy the square. This little moment is yours.</Text>
          <View style={styles.buttonShadow}><Pressable accessibilityRole="button" accessibilityLabel={checkedIn ? 'Demo check-in complete' : 'Try a demo check-in'} accessibilityState={{ disabled: checkedIn }} disabled={checkedIn} onPress={() => setCheckedIn(true)} style={({ pressed }) => [styles.button, checkedIn && styles.doneButton, pressed && styles.pressed]}>
            <Text style={styles.buttonText}>{checkedIn ? 'Checked in — demo' : 'Try demo check-in'}</Text><Feather name={checkedIn ? 'check' : 'arrow-right'} size={22} color={C.ink} />
          </Pressable></View>
          <Text accessibilityLiveRegion="polite" style={styles.note}>{checkedIn ? 'Preview only. Nothing was saved and no stamp was awarded.' : 'Demo only · GPS is not connected. A quest stamp will be earned after all stops are completed.'}</Text>
        </View></View>
        <View style={styles.bottom}>
          <Pressable accessibilityRole="button" accessibilityLabel="Preview quest completion screen, demo only" onPress={() => router.push('/stamp-earned')} style={styles.routeButton}>
            <Feather name="award" size={18} color={C.ink} /><Text style={styles.routeText}>Preview quest completion</Text>
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="View sample passport" onPress={() => router.push('/passport')} style={styles.routeButton}>
            <Feather name="book-open" size={18} color={C.ink} /><Text style={styles.routeText}>Preview my passport</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={showRoute} style={({ pressed }) => [styles.routeButton, pressed && { opacity: 0.6 }]}>
            <Feather name="map" size={17} color={C.ink} /><Text style={styles.routeText}>{checkedIn ? 'Back to the adventure' : 'Not yet — show me the map'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.deep }, body: { flex: 1, backgroundColor: C.paper }, content: { flexGrow: 1 },
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
  note: { color: '#6B817B', fontSize: 11, lineHeight: 16, marginTop: 15 },
  bottom: { flex: 1, minHeight: 100, justifyContent: 'flex-end', alignItems: 'center', paddingVertical: 22, paddingHorizontal: 24 },
  routeButton: { flexDirection: 'row', alignItems: 'center', gap: 9, minHeight: 44, padding: 10 }, routeText: { fontSize: 14, color: C.ink, flexShrink: 1 },
});
