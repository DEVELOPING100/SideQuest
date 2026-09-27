import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFocusEffect, useRouter } from 'expo-router';
import Feather from '@expo/vector-icons/Feather';
import { getPassport } from '../api';
import Stamp from '../components/Stamp';

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
          <Text style={styles.eyebrow}>{preview ? 'SAMPLE COLLECTION' : 'YOUR COLLECTION'}</Text>
          <Text style={styles.title}>Adventure Passport</Text>
          <Text style={styles.subtitle}>Little moments, officially collected.</Text>
          {showCollection && <Text accessibilityLiveRegion="polite" style={styles.count}>
            {visibleStamps.length} {preview ? 'sample ' : ''}{visibleStamps.length === 1 ? 'stamp' : 'stamps'} collected
          </Text>}
        </View>

        <View style={styles.page}>
          <Text style={styles.pageTitle}>{preview ? 'Sample passport' : 'Your adventure stamps'}</Text>
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
          ) : visibleStamps.map(stamp => (
            <Stamp key={stamp.stampId} title={stamp.title} stopCount={stamp.stopCount} earnedAt={stamp.earnedAt} />
          ))}

          <Text style={styles.footer}>Keep exploring. Your next stamp is waiting.</Text>
          {!preview && !loading && <Pressable accessibilityRole="button" onPress={() => setReloadCount(count => count + 1)} style={styles.button}>
            <Text style={styles.buttonText}>Refresh passport</Text>
          </Pressable>}
          <Pressable accessibilityRole="button" onPress={preview ? showSavedPassport : () => setPreview(true)}
            style={({ pressed }) => [styles.previewButton, pressed && styles.pressed]}>
            <Text style={styles.previewText}>{preview ? 'Return to saved passport' : 'Preview sample stamps'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const C = { ink: '#173E39', dark: '#12322E', lime: '#D6F65B', paper: '#FFFEFA', muted: '#6B817B' };
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.dark },
  scroll: { flex: 1, backgroundColor: C.paper },
  content: { paddingBottom: 24 },
  header: { backgroundColor: C.dark, paddingHorizontal: 24, paddingBottom: 32, borderBottomLeftRadius: 32, borderBottomRightRadius: 32 },
  back: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  eyebrow: { color: C.lime, fontSize: 11, letterSpacing: 2, marginBottom: 14 },
  title: { color: C.paper, fontSize: 34, fontWeight: '800' },
  subtitle: { color: '#C1D1CC', fontSize: 15, lineHeight: 23, marginTop: 12 },
  count: { color: C.lime, fontSize: 23, fontWeight: '700', marginTop: 24 },
  page: { margin: 18, padding: 18, borderWidth: 1.5, borderColor: C.ink, borderRadius: 24, backgroundColor: C.paper },
  pageTitle: { color: C.ink, fontSize: 23, fontWeight: '800', marginBottom: 14 },
  notice: { backgroundColor: '#F0F4D5', color: C.ink, padding: 12, borderRadius: 12, fontSize: 14, lineHeight: 21 },
  state: { alignItems: 'center', paddingVertical: 30, gap: 16 },
  stateTitle: { color: C.ink, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  body: { color: C.muted, fontSize: 15, lineHeight: 23, textAlign: 'center' },
  error: { color: '#A23528', fontSize: 14, lineHeight: 21, textAlign: 'center' },
  button: { minHeight: 48, backgroundColor: C.lime, borderWidth: 1.5, borderColor: C.ink, borderRadius: 18, padding: 14, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: C.ink, fontSize: 15, fontWeight: '700' },
  footer: { color: C.muted, fontSize: 14, lineHeight: 21, marginVertical: 22, textAlign: 'center' },
  previewButton: { minHeight: 48, alignItems: 'center', justifyContent: 'center', padding: 12 },
  previewText: { color: C.ink, fontSize: 14, textDecorationLine: 'underline', textAlign: 'center' },
  pressed: { opacity: 0.7 },
});
