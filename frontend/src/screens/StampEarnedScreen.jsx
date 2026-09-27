import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { SAMPLE_PASSPORT } from '../data/samplePassport';

const quest = SAMPLE_PASSPORT[0];
const C = { paper: '#FFFEFA', ink: '#173E39', lime: '#D6F65B', pale: '#F0F4D5', muted: '#6B817B' };

export default function StampEarnedScreen() {
  const router = useRouter();
  function back() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }
  return <SafeAreaView style={styles.safe}>
    <StatusBar style="dark" />
    <View pointerEvents="none" style={styles.glowTop} />
    <View pointerEvents="none" style={styles.glowBottom} />
    <View style={styles.header}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back to demo" onPress={back} style={styles.back}><Feather name="chevron-left" size={24} color={C.ink} /></Pressable>
      <Text style={styles.demo}>COMPLETION PREVIEW</Text>
    </View>
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>QUEST STAMP · DEMO</Text>
      <Text accessibilityRole="header" style={styles.title}>Nice one, explorer!</Text>
      <Text style={styles.description}>Every stop, a little story. Here’s how we’ll celebrate when you complete your whole adventure.</Text>
      <View style={styles.stampArea} accessible accessibilityLabel={`Sample ${quest.title} quest stamp, ${quest.city}. Not an earned reward.`}>
        <View style={styles.stampShadow} />
        <View style={styles.stampOuter}><View style={styles.stampInner}><View style={styles.stampLine}>
          <Text style={styles.stampTitle}>{quest.title.toUpperCase()}</Text>
          <Feather name={quest.icon} size={30} color={C.ink} />
          <Text style={styles.stampPlace}>{quest.city.toUpperCase()}</Text>
          <Text style={styles.stampSample}>SAMPLE QUEST</Text>
        </View></View></View>
        <Text style={styles.sparkCoral}>✦</Text><Text style={styles.sparkGreen}>✦</Text>
      </View>
      <View style={styles.buttonShadow}><Pressable accessibilityRole="button" accessibilityLabel="See the sample collection in my passport" onPress={() => router.push('/passport')} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
        <Text style={styles.buttonText}>See it in my passport</Text><Feather name="arrow-right" size={22} color={C.ink} />
      </Pressable></View>
      <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/')} style={styles.explore}><Text style={styles.exploreText}>Keep exploring</Text></Pressable>
      <Text style={styles.note}>Design preview only. No quest was completed or stamp saved. A real stamp is awarded after every stop is checked in.</Text>
    </ScrollView>
  </SafeAreaView>;
}
const styles = StyleSheet.create({
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
