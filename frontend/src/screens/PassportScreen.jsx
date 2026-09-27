import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { SAMPLE_PASSPORT } from '../data/samplePassport';

const C = { paper: '#FFFEFA', ink: '#173E39', deep: '#12322E', lime: '#D6F65B', muted: '#6B817B', line: '#D9E0D6' };
const distance = SAMPLE_PASSPORT.reduce((total, quest) => total + quest.distanceKm, 0).toFixed(1);

function Stamp({ quest, index }) {
  function showDetails() {
    Alert.alert(`${quest.title} · Sample quest`, `${quest.city}\n${quest.stops} stops · ${quest.distanceKm} km\n\nAn example stamp for a completed adventure. This is demo content, not your saved activity.`, [{ text: 'Close' }]);
  }
  return <View style={[styles.stampSlot, index % 2 === 1 && styles.lowerStamp]}>
    <Pressable accessibilityRole="button" accessibilityLabel={`View sample ${quest.title} quest stamp`} onPress={showDetails}
      style={({ pressed }) => [styles.stamp, { borderColor: quest.color, transform: [{ rotate: quest.rotation }], opacity: pressed ? 0.6 : 1 }]}>
      <View style={[styles.stampInside, { borderColor: quest.color }]}>
        <Text style={[styles.stampTitle, { color: quest.color }]}>{quest.title.toUpperCase()}</Text>
        <Feather name={quest.icon} size={25} color={quest.color} />
        <Text style={[styles.stampCity, { color: quest.color }]}>{quest.city.toUpperCase()}</Text>
      </View>
    </Pressable>
  </View>;
}

export default function PassportScreen() {
  const router = useRouter();
  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }
  function explore() { router.dismissTo('/'); }
  return <SafeAreaView style={styles.safe} edges={['top']}>
    <StatusBar style="light" />
    <SafeAreaView style={styles.body} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.topRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} style={styles.back}><Feather name="arrow-left" size={23} color={C.paper} /></Pressable>
            <Text style={styles.sampleBadge}>SAMPLE COLLECTION</Text>
          </View>
          <Text style={styles.eyebrow}>YOUR COLLECTION</Text>
          <Text accessibilityRole="header" style={styles.title}>Your Passport</Text>
          <View style={styles.stats}>
            {[[String(SAMPLE_PASSPORT.length), 'QUESTS'], [String(SAMPLE_PASSPORT.length), 'STAMPS'], [`${distance} km`, 'EXPLORED']].map(([value,label]) => <View key={label} style={styles.stat}>
              <Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text>
            </View>)}
          </View>
        </View>
        <View style={styles.pageShadow}><View style={styles.page}>
          <View pointerEvents="none" style={styles.contours}>{[140,210,280,350,420,490,560].map(size => <View key={size} style={[styles.contour, { width: size, height: size, borderRadius: size / 2, left: 80 - size / 2, top: 235 - size / 2 }]} />)}</View>
          <View pointerEvents="none" style={styles.innerBorder} />
          <View style={styles.pageHeading}><Text accessibilityRole="header" style={styles.region}>New Brunswick</Text><Text style={styles.pageNumber}>PAGE 01</Text></View>
          <Text style={styles.subtitle}>Little moments, officially collected.</Text>
          <View style={styles.rule} />
          <View style={styles.stampGrid}>{SAMPLE_PASSPORT.map((quest,index) => <Stamp key={quest.id} quest={quest} index={index} />)}</View>
          <Text style={styles.quote}>“We found a whole new side of the city today.”</Text>
          <View style={styles.rule} />
          <Pressable accessibilityRole="button" accessibilityLabel="Keep exploring, return to preferences" onPress={explore} style={({ pressed }) => [styles.explore, pressed && { opacity: 0.65 }]}>
            <View style={styles.exploreCopy}><Text style={styles.exploreTitle}>Keep exploring.</Text><Text style={styles.subtitle}>Your next stamp is waiting.</Text></View>
            <View style={styles.exploreIcon}><Feather name="compass" size={24} color={C.ink} /></View>
          </Pressable>
        </View></View>
        <Text style={styles.note}>Design preview · All stamps and totals shown are sample data. Complete every stop in a live quest to earn a real quest stamp.</Text>
      </ScrollView>
    </SafeAreaView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.deep }, body: { flex: 1, backgroundColor: C.paper }, content: { paddingBottom: 22 },
  hero: { backgroundColor: C.deep, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, paddingHorizontal: 25, paddingBottom: 28 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 },
  back: { width: 44, height: 44, justifyContent: 'center' }, sampleBadge: { fontSize: 9, letterSpacing: 1.2, color: '#BED0C7', borderWidth: 1, borderColor: '#4A6860', borderRadius: 6, paddingHorizontal: 9, paddingVertical: 6 },
  eyebrow: { color: C.lime, fontSize: 11, letterSpacing: 1.6, marginBottom: 14 }, title: { color: C.paper, fontSize: 35, fontWeight: '800', letterSpacing: -1.1 },
  stats: { flexDirection: 'row', gap: 25, marginTop: 25 }, stat: { flexShrink: 1 }, statValue: { color: C.lime, fontSize: 26, fontWeight: '800' }, statLabel: { color: '#BDD0C9', fontSize: 9, letterSpacing: 1.2, marginTop: 6 },
  pageShadow: { marginHorizontal: 20, marginTop: 20, backgroundColor: '#C5CEC4', borderRadius: 24, paddingBottom: 5, paddingRight: 3 },
  page: { borderWidth: 1.8, borderColor: C.ink, borderTopLeftRadius: 12, borderTopRightRadius: 24, borderBottomLeftRadius: 12, borderBottomRightRadius: 28, backgroundColor: C.paper, overflow: 'hidden', paddingHorizontal: 20, paddingTop: 25, paddingBottom: 29 },
  contours: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', opacity: 0.6 }, contour: { position: 'absolute', borderWidth: 1, borderColor: '#E1E7DB', transform: [{ scaleX: 1.35 }, { rotate: '-25deg' }] },
  innerBorder: { position: 'absolute', top: 12, bottom: 12, left: 12, right: 12, borderWidth: 1, borderColor: '#E5EADF', borderRadius: 14 },
  pageHeading: { flexDirection: 'row', gap: 8, alignItems: 'baseline', flexWrap: 'wrap', justifyContent: 'space-between' }, region: { fontSize: 23, fontWeight: '800', color: C.ink, letterSpacing: -0.7 }, pageNumber: { color: C.muted, fontSize: 9 },
  subtitle: { color: C.muted, fontSize: 12, lineHeight: 18, marginTop: 8 }, rule: { height: 1, backgroundColor: C.line, marginTop: 18 },
  stampGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingTop: 15, paddingBottom: 14 },
  stampSlot: { width: '48%', paddingVertical: 8, alignItems: 'center' }, lowerStamp: { paddingTop: 25 },
  stamp: { width: '100%', maxWidth: 134, aspectRatio: 1, borderWidth: 1.3, borderRadius: 100, padding: 3, backgroundColor: '#FFFEFAE8' },
  stampInside: { flex: 1, borderWidth: 0.8, borderRadius: 100, alignItems: 'center', justifyContent: 'space-evenly', paddingVertical: 12, paddingHorizontal: 7 },
  stampTitle: { fontSize: 9, letterSpacing: 0.8, textAlign: 'center' }, stampCity: { fontSize: 8, letterSpacing: 0.7, textAlign: 'center' },
  quote: { color: C.muted, fontSize: 13, fontStyle: 'italic', lineHeight: 20, maxWidth: 190, marginTop: 5 },
  explore: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 20 }, exploreCopy: { flex: 1 }, exploreTitle: { color: C.ink, fontSize: 15, fontWeight: '500' }, exploreIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  note: { color: C.muted, fontSize: 11, lineHeight: 17, marginHorizontal: 26, marginTop: 16 },
});
