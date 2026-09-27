import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import AdventureMap from '../components/AdventureMap';
import { SAMPLE_STOPS } from '../data/sampleAdventure';

const C = { paper: '#FFFEFA', ink: '#173E39', lime: '#D6F65B', pale: '#F0F4D5', muted: '#6B817B', line: '#D9E0D6', shadow: '#12322E' };
function single(value, fallback) { return typeof value === 'string' ? value : fallback; }

export default function AdventureScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [favorite, setFavorite] = useState(false);
  const minutes = single(params.minutes, '90');
  const budget = single(params.budget, '25');
  const group = single(params.groupSize, '2');
  const vibes = single(params.vibes, 'Romance + Relax / chill') || 'Open to any vibe';
  const travel = single(params.travel, 'Walk');

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }
  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to preferences" onPress={goBack} style={({ pressed }) => [styles.circle, pressed && styles.pressed]}><Feather name="chevron-left" size={23} color={C.ink} /></Pressable>
      <Text accessibilityRole="header" style={styles.headerTitle}>Your quest is ready!</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={favorite ? 'Remove preview favorite' : 'Favorite this preview'} accessibilityState={{ selected: favorite }} onPress={() => setFavorite(v => !v)} style={({ pressed }) => [styles.circle, favorite && styles.favorite, pressed && styles.pressed]}><Feather name="heart" size={22} color={C.ink} /></Pressable>
    </View>
    <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
      <View style={styles.stats}>
        {[[`${minutes} min`, 'YOUR TIME'], [`${group} ${group === '1' ? 'person' : 'people'}`, 'YOUR CREW'], [`$${budget}`, 'BUDGET · CAD']].map(([value,label]) => <View key={label} style={styles.stat}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>)}
      </View>
      <AdventureMap stops={SAMPLE_STOPS} />
      <View style={styles.card}>
        <Text style={styles.eyebrow}>{vibes.toUpperCase()}</Text>
        <Text accessibilityRole="header" style={styles.title}>A little downtown escape</Text>
        <Text style={styles.description}>A square, a café, and a gallery. Discover three sample stops in the heart of Fredericton.</Text>
        {SAMPLE_STOPS.map((stop,index) => <View key={stop.name} style={styles.stop}>
          <View style={styles.number}><Text style={styles.numberText}>{index+1}</Text></View>
          <View style={styles.stopCopy}><Text style={styles.stopName}>{stop.name}</Text><Text style={styles.stopDetail}>{stop.detail}</Text></View>
          <Text style={styles.duration}>{stop.minutes} min</Text>
        </View>)}
        <View style={styles.previewNote}><Feather name="info" size={15} color={C.muted} /><Text style={styles.noteText}>Real locations, sample adventure. Visit times are estimates, not matched to your preferences. Directions and travel times are not connected yet.</Text></View>
        <Text style={styles.mode}>Fredericton, NB · {travel} selected</Text>
        {favorite && <Text accessibilityLiveRegion="polite" style={styles.favoriteNote}>Favorited for this preview only.</Text>}
      </View>
    </ScrollView>
    <View style={styles.footer}><View style={styles.shadow}>
      <Pressable accessibilityRole="button" accessibilityLabel="Let’s go, open demo check-in" onPress={() => router.push('/check-in')} style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}><Text style={styles.primaryText}>Let’s go</Text><Feather name="arrow-right" size={23} color={C.ink} /></Pressable>
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
  card: { marginHorizontal: 24, marginTop: 16, paddingHorizontal: 18, paddingTop: 25, borderTopWidth: 1.5, borderColor: C.ink, borderTopLeftRadius: 29, borderTopRightRadius: 29, backgroundColor: C.paper },
  eyebrow: { color: C.ink, fontSize: 10, letterSpacing: 1.5, lineHeight: 17, marginBottom: 13 },
  title: { color: C.ink, fontSize: 29, fontWeight: '800', letterSpacing: -0.8, marginBottom: 11 },
  description: { color: C.muted, fontSize: 15, lineHeight: 23, marginBottom: 4 },
  stop: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 17, borderBottomWidth: 1, borderBottomColor: C.line },
  number: { width: 38, height: 40, borderRadius: 11, borderWidth: 1.6, borderColor: C.ink, backgroundColor: C.lime, justifyContent: 'center', alignItems: 'center' },
  numberText: { color: C.ink, fontSize: 15, fontWeight: '500' }, stopCopy: { flex: 1 },
  stopName: { fontSize: 14, color: C.ink, marginBottom: 6, lineHeight: 19 }, stopDetail: { fontSize: 11, color: C.muted, lineHeight: 16 },
  duration: { color: C.ink, fontSize: 12 }, previewNote: { flexDirection: 'row', gap: 7, marginTop: 20 }, noteText: { flex: 1, fontSize: 11, color: C.muted, lineHeight: 17 },
  mode: { color: C.muted, fontSize: 11, marginTop: 12 }, favoriteNote: { color: C.ink, fontSize: 11, marginTop: 10 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12, backgroundColor: C.paper },
  shadow: { backgroundColor: C.shadow, borderRadius: 24, paddingBottom: 5, paddingRight: 4 },
  primary: { backgroundColor: C.lime, borderWidth: 1.8, borderColor: C.ink, borderRadius: 23, minHeight: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 15 },
  primaryPressed: { transform: [{ translateX: 2 }, { translateY: 3 }] }, primaryText: { fontSize: 20, fontWeight: '800', color: C.ink, letterSpacing: -0.5 },
});
