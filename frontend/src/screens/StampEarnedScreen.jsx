import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { getPassport } from '../api';

const C = { paper: '#FFFEFA', ink: '#173E39', lime: '#D6F65B', pale: '#F0F4D5', muted: '#6B817B' };

export default function StampEarnedScreen() {
  const router = useRouter();
  const { adventureId } = useLocalSearchParams();
  const [stamp, setStamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function loadStamp() {
      setLoading(true);
      setError('');
      setStamp(null);
      try {
        if (typeof adventureId !== 'string' || !adventureId) {
          throw new Error('Open this screen from a completed adventure to see its stamp.');
        }
        const passport = await getPassport();
        if (!Array.isArray(passport.stamps)) throw new Error('The passport response is missing its stamps.');
        // The backend returns newest first. Match this adventure, not another quest.
        const earned = passport.stamps.find(item => item.adventureId === adventureId);
        if (!earned) throw new Error('No saved stamp was found for this adventure yet. Please retry.');
        if (active) setStamp(earned);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load your earned stamp.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadStamp();
    return () => { active = false; };
  }, [adventureId, attempt]);

  const earnedDate = stamp?.earnedAt ? new Date(stamp.earnedAt) : null;
  const dateLabel = earnedDate && !Number.isNaN(earnedDate.getTime())
    ? earnedDate.toLocaleDateString() : 'Date unavailable';
  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }
  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <View pointerEvents="none" style={styles.glowTop} />
    <View pointerEvents="none" style={styles.glowBottom} />
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={back} style={styles.back}><Feather name="chevron-left" size={24} color={C.ink} /></Pressable>
      <Text style={styles.demo}>ADVENTURE PASSPORT</Text>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      {loading ? <View style={styles.state}>
        <ActivityIndicator color={C.ink} size="large" />
        <Text accessibilityLiveRegion="polite" style={styles.description}>Loading your earned stamp...</Text>
      </View> : error ? <View style={styles.state}>
        <Text style={styles.title}>Stamp unavailable</Text>
        <Text accessibilityRole="alert" style={styles.description}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={() => setAttempt(value => value + 1)} style={styles.button}>
          <Text style={styles.buttonText}>Retry</Text>
        </Pressable>
      </View> : stamp && <>
      <Text style={styles.eyebrow}>QUEST STAMP EARNED</Text>
      <Text accessibilityRole="header" style={styles.title}>Nice one, explorer!</Text>
      <Text style={styles.description}>{stamp.title}</Text>
      <View style={styles.stampArea} accessible accessibilityLabel={`Earned ${stamp.title} quest stamp, ${stamp.stopCount} stops completed.`}>
        <View style={styles.stampShadow} />
        <View style={styles.stampOuter}><View style={styles.stampInner}><View style={styles.stampLine}>
          <Text style={styles.stampTitle} numberOfLines={3}>{stamp.title.toUpperCase()}</Text>
          <Feather name="award" size={30} color={C.ink} />
          <Text style={styles.stampPlace}>{stamp.stopCount} {stamp.stopCount === 1 ? 'STOP' : 'STOPS'} COMPLETED</Text>
          <Text style={styles.stampSample}>{dateLabel}</Text>
        </View></View></View>
        <Text style={styles.sparkCoral}>✦</Text><Text style={styles.sparkGreen}>✦</Text>
      </View>
      </>}
      <View style={styles.buttonShadow}><Pressable accessibilityRole="button" accessibilityLabel="See it in my passport" onPress={() => router.push('/passport')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>See it in my passport</Text><Feather name="arrow-right" size={22} color={C.ink} />
      </Pressable></View>
      <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/')} style={styles.explore}><Text style={styles.exploreText}>Keep exploring</Text></Pressable>
      {stamp && !loading && !error && <Text style={styles.note}>Saved to your Adventure Passport.</Text>}
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  state: { alignItems: 'center', gap: 20, marginBottom: 28 },
  safe: { flex: 1, backgroundColor: C.paper, overflow: 'hidden' },
  glowTop: { position: 'absolute', width: 340, height: 340, borderRadius: 170, top: -120, left: -170, backgroundColor: '#F5FAD9' },
  glowBottom: { position: 'absolute', width: 370, height: 480, borderRadius: 185, bottom: -150, right: -250, backgroundColor: '#FFF0E9' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 22, paddingTop: 5 },
  back: { width: 44, height: 44, justifyContent: 'center' }, demo: { color: C.muted, fontSize: 9, letterSpacing: 1.3 },
  content: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 26, paddingTop: 30, paddingBottom: 25 },
  eyebrow: { fontSize: 12, letterSpacing: 2, color: C.muted, marginBottom: 23 },
  title: { color: C.ink, fontSize: 33, fontWeight: '800', letterSpacing: -1, textAlign: 'center', marginBottom: 13 },
  description: { color: C.muted, fontSize: 15, lineHeight: 23, textAlign: 'center', maxWidth: 340 },
  stampArea: { width: '85%', maxWidth: 270, aspectRatio: 1, marginTop: 30, marginBottom: 34 },
  stampShadow: { position: 'absolute', left: 10, top: 10, width: '100%', height: '100%', borderRadius: 150, backgroundColor: C.lime },
  stampOuter: { flex: 1, backgroundColor: C.pale, borderWidth: 1.8, borderColor: C.ink, borderRadius: 150, padding: 24 },
  stampInner: { flex: 1, borderRadius: 150, borderWidth: 1.6, borderColor: C.ink, backgroundColor: C.paper, padding: 3 },
  stampLine: { flex: 1, borderWidth: 1, borderColor: C.ink, borderRadius: 150, justifyContent: 'center', alignItems: 'center', gap: 13, transform: [{ rotate: '-8deg' }], padding: 9 },
  stampTitle: { color: C.ink, fontSize: 11, letterSpacing: 1.4, textAlign: 'center' },
  stampPlace: { color: C.ink, fontSize: 10, letterSpacing: 0.8, textAlign: 'center' }, stampSample: { fontSize: 8, color: C.muted, letterSpacing: 1 },
  sparkCoral: { position: 'absolute', top: 26, left: -12, color: '#FF765B', fontSize: 30 }, sparkGreen: { position: 'absolute', right: -11, bottom: 22, color: C.ink, fontSize: 30 },
  buttonShadow: { width: '100%', backgroundColor: '#12322E', borderRadius: 23, paddingRight: 4, paddingBottom: 5 },
  button: { minHeight: 64, borderRadius: 22, borderWidth: 1.8, borderColor: C.ink, backgroundColor: C.lime, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 14 },
  buttonText: { fontSize: 18, fontWeight: '800', color: C.ink, flexShrink: 1, textAlign: 'center' }, pressed: { transform: [{ translateX: 2 }, { translateY: 3 }] },
  explore: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 18, marginTop: 10 }, exploreText: { fontSize: 14, color: C.ink },
  note: { marginTop: 13, fontSize: 11, color: C.muted, textAlign: 'center', lineHeight: 17, maxWidth: 320 },
});
