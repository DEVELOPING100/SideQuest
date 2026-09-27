import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { getPassport } from '../api';
import { getCurrentAdventure } from '../data/adventureStore';
import Stamp from '../components/Stamp';
import PassportPhotos from '../components/PassportPhotos';

// Used only when the user explicitly opens the sample preview. Never saved.
const SAMPLE_STAMPS = [
  { stampId: 'preview-1', title: "Officers' Square to Gallery 78", stopCount: 3, earnedAt: '2026-09-27T15:00:00Z' },
  { stampId: 'preview-2', title: 'A little afternoon adventure', stopCount: 2, earnedAt: '2026-09-26T15:00:00Z' },
];

export default function PassportGallery() {
  const router = useRouter();
  const [stamps, setStamps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(false);
  const [reloadCount, setReloadCount] = useState(0);

  // Reload whenever this screen is revisited, so newly earned stamps appear.
  useFocusEffect(useCallback(() => {
    let active = true;
    if (preview) return;

    async function loadPassport() {
      setLoading(true);
      setError('');
      try {
        const data = await getPassport();
        if (!Array.isArray(data.stamps)) {
          throw new Error('The passport response did not contain a stamps array.');
        }
        // The backend already returns the newest stamps first.
        if (active) setStamps(data.stamps);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load your passport.');
      } finally {
        if (active) setLoading(false);
      }
    }

    loadPassport();
    // Ignore late responses after leaving the screen or switching to preview.
    return () => { active = false; };
  // Changing the counter intentionally reruns the focus effect for manual refresh.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preview, reloadCount]));

  const activeAdventure = getCurrentAdventure();
  const continuing = activeAdventure?.stops?.some(stop => !stop.completed);
  const visibleStamps = preview ? SAMPLE_STAMPS : stamps;
  const showCollection = preview || (!loading && !error);

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/');
  }

  function showSavedPassport() {
    setLoading(true);
    setError('');
    setPreview(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={goBack}
            style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
            <Feather name="arrow-left" size={22} color={C.paper} />
          </Pressable>
          <View style={styles.editionBadge}><Text style={styles.editionBadgeText}>ATLANTIC EDITION | {new Date().getFullYear()}</Text></View>
          <Text style={styles.eyebrow}>{preview ? 'SAMPLE COLLECTION' : 'YOUR COLLECTION'}</Text>
          <Text style={styles.title}>Your Passport</Text>

          <View pointerEvents="none" style={styles.headerRing} />
          {showCollection && <View style={styles.stats} accessibilityLiveRegion="polite">
            {[[new Set(visibleStamps.map(s => s.adventureId || s.stampId)).size, 'QUESTS'], [visibleStamps.length, 'STAMPS'], [visibleStamps.reduce((n, s) => n + (Number(s.stopCount) || 0), 0), 'STOPS VISITED']].map(([value, label]) => <View key={label}><Text style={styles.statValue}>{value}</Text><Text style={styles.statLabel}>{label}</Text></View>)}
          </View>}
        </View>

        <View style={styles.pageShadow}><View style={styles.page}>
          <View pointerEvents="none" style={styles.innerBorder} />
          <View style={styles.pageTop}><Text style={styles.edition}>ADVENTURE PASSPORT</Text><Text style={styles.edition}>PAGE 01</Text></View>
          <Text style={styles.pageTitle}>{preview ? 'Sample passport' : 'New Brunswick'}</Text>
          <View style={styles.underline} />
          <Text style={styles.pageCaption}>Little moments, officially collected.</Text>
          <View style={styles.divider} />
          {preview && <Text style={styles.notice}>Preview only. These sample stamps are not saved and are not part of your passport.</Text>}

          {!preview && loading ? (
            <View style={styles.state}>
              <ActivityIndicator color={C.ink} accessibilityLabel="Loading passport" />
              <Text accessibilityLiveRegion="polite" style={styles.body}>Loading your saved stamps…</Text>
            </View>
          ) : !preview && error ? (
            <View style={styles.state}>
              <Text style={styles.stateTitle}>Couldn’t load your passport</Text>
              <Text accessibilityRole="alert" style={styles.error}>{error}</Text>
              <Pressable accessibilityRole="button" onPress={() => setReloadCount(count => count + 1)} style={styles.button}>
                <Text style={styles.buttonText}>Try again</Text>
              </Pressable>
            </View>
          ) : visibleStamps.length === 0 ? (
            <View style={styles.state}>
              <Feather name="book-open" size={40} color={C.ink} />
              <Text style={styles.stateTitle}>Your first stamp is waiting</Text>
              <Text style={styles.body}>Complete every stop in an adventure to earn a stamp. It will appear here once saved.</Text>
            </View>
          ) : <View style={styles.stampGrid}>{visibleStamps.map((stamp, index) => (
            <Stamp compact scrapbook index={index} key={stamp.stampId} title={stamp.title} stopCount={stamp.stopCount} earnedAt={stamp.earnedAt} />
          ))}</View>}

          {showCollection && visibleStamps.length > 0 && <View style={styles.memoryNote}><Text style={styles.noteKicker}>WANDER PASS</Text><Text style={styles.noteTitle}>NB · {String(visibleStamps.length).padStart(2, '0')}</Text><Text style={styles.noteCopy}>Keep the scenic route.</Text></View>}
          {showCollection && visibleStamps.length > 0 && <View style={styles.paperNote}><Text style={styles.paperNoteText}>Little moments worth keeping.</Text></View>}
          {!preview && <PassportPhotos />}
          <View style={styles.footer}><Text style={styles.footerTitle}>Keep exploring.</Text><Text style={styles.footerCopy}>Your next stamp is waiting.</Text></View>
          <Pressable accessibilityRole="button" onPress={() => continuing ? router.navigate({ pathname: '/adventure', params: { adventureId: activeAdventure.adventureId, travel: activeAdventure.travel || 'Walk' } }) : router.dismissTo('/')} style={styles.button}><Text style={styles.buttonText}>{continuing ? 'Continue the journey →' : 'Plan your next journey →'}</Text></Pressable>
          {!preview && !loading && <Pressable accessibilityRole="button" onPress={() => setReloadCount(count => count + 1)} style={styles.previewButton}>
            <Text style={styles.previewText}>Refresh passport</Text>
          </Pressable>}
          <Pressable accessibilityRole="button" onPress={preview ? showSavedPassport : () => setPreview(true)}
            style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}>
            <Text style={styles.previewText}>{preview ? 'Return to saved passport' : 'Preview sample stamps'}</Text>
          </Pressable>
        </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const C = { ink: '#173E39', dark: '#12322E', lime: '#D1FF4A', paper: '#FFFDFA', muted: '#6B817B' };
const styles = StyleSheet.create({
  paperNote: { alignSelf: 'flex-end', maxWidth: 150, padding: 13, marginTop: 18, marginBottom: 8, backgroundColor: '#F2F6DA', borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#E2E8D0', transform: [{ rotate: '3deg' }] },
  paperNoteText: { color: C.muted, fontSize: 12, lineHeight: 18, fontStyle: 'italic' },
  editionBadge: { position: 'absolute', right: 20, top: 18, borderWidth: 1, borderColor: '#68823E', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 8, transform: [{ rotate: '2deg' }] },
  editionBadgeText: { color: C.lime, fontSize: 7, letterSpacing: 1, fontWeight: '800' },
  pageShadow: { margin: 16, marginBottom: 24, borderRadius: 24, borderBottomRightRadius: 42, backgroundColor: '#CDD5CE', paddingRight: 5, paddingBottom: 7 },
  innerBorder: { position: 'absolute', top: 10, left: 10, right: 10, bottom: 10, borderWidth: 1, borderColor: '#D9E0D6', borderRadius: 10, borderBottomRightRadius: 32 },
  footerTitle: { color: C.ink, fontSize: 16 }, footerCopy: { color: C.muted, fontSize: 12, marginTop: 10 },
  underline: { width: 44, height: 4, backgroundColor: C.lime, borderRadius: 3, marginBottom: 12 },
  pageCaption: { color: C.muted, fontSize: 12, lineHeight: 18 }, divider: { height: 1, backgroundColor: '#D5DEDA', marginVertical: 22 },
  memoryNote: { alignSelf: 'flex-start', marginTop: 16, padding: 14, backgroundColor: '#FFF0E9', borderWidth: 1, borderStyle: 'dashed', borderColor: '#FF765B', transform: [{ rotate: '-3deg' }] },
  noteKicker: { color: '#D96149', fontSize: 8, fontWeight: '800', letterSpacing: 1 }, noteTitle: { color: C.ink, fontSize: 18, fontWeight: '800', marginVertical: 6 }, noteCopy: { color: C.muted, fontSize: 10, fontStyle: 'italic' },
  headerRing: { position: 'absolute', width: 225, height: 225, borderWidth: 20, borderColor: '#D1FF4A12', borderRadius: 120, right: -90, bottom: -95 },
  stats: { flexDirection: 'row', gap: 24, marginTop: 24 }, statValue: { color: C.lime, fontSize: 27, fontWeight: '800' }, statLabel: { color: '#C1D1CC', fontSize: 8, letterSpacing: 1, marginTop: 5 },
  paperPattern: { ...StyleSheet.absoluteFillObject, overflow: 'hidden', opacity: 0.55 }, contour: { position: 'absolute', borderWidth: 1, borderColor: '#DDE5D8', transform: [{ scaleX: 1.4 }, { rotate: '-25deg' }] },
  pageTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }, edition: { color: C.muted, fontSize: 9, letterSpacing: 1.4 },
  stampGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 10 },
  safe: { flex: 1, backgroundColor: C.dark },
  scroll: { flex: 1, backgroundColor: C.paper },
  content: { paddingBottom: 24 },
  header: { backgroundColor: C.dark, paddingHorizontal: 24, paddingBottom: 30, borderBottomLeftRadius: 32, borderBottomRightRadius: 38, overflow: 'hidden' },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  eyebrow: { color: C.lime, fontSize: 11, letterSpacing: 2, marginBottom: 14 },
  title: { color: C.paper, fontSize: 34, fontWeight: '800' },
  subtitle: { color: '#C1D1CC', fontSize: 15, lineHeight: 23, marginTop: 12 },
  count: { color: C.lime, fontSize: 23, fontWeight: '700', marginTop: 24 },
  page: { padding: 24, borderWidth: 1.5, borderColor: C.ink, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 4, borderBottomRightRadius: 42, backgroundColor: C.paper, overflow: 'hidden' },
  pageTitle: { color: C.ink, fontSize: 23, fontWeight: '800', marginBottom: 14 },
  notice: { backgroundColor: '#F0F4D5', color: C.ink, padding: 12, borderRadius: 12, fontSize: 14, lineHeight: 21 },
  state: { alignItems: 'center', paddingVertical: 30, gap: 16 },
  stateTitle: { color: C.ink, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  body: { color: C.muted, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  error: { color: '#A23528', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  button: { minHeight: 48, backgroundColor: C.lime, borderRadius: 20, padding: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: C.ink, fontSize: 15, fontWeight: '700' },
  footer: { borderTopWidth: 1, borderColor: '#D5DEDA', paddingTop: 20, marginTop: 28, marginBottom: 20 },
  previewButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 12 },
  previewText: { color: C.ink, fontSize: 14, textDecorationLine: 'underline', textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
