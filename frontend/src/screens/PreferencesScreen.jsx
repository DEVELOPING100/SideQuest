import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'expo-router';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Feather from '@expo/vector-icons/Feather';
import { generateAdventure, getAdventure } from '../api';
import { CITIES } from '../data/cities';
import PreferenceIcon from '../components/PreferenceIcon';
import Motion from '../components/Motion';
import { setCurrentAdventure } from '../data/adventureStore';

const C = { paper: '#FFFDFA', ink: '#173E39', lime: '#D1FF4A', pale: '#F0F4D5', muted: '#6B817B', line: '#D9E0D6', shadow: '#12322E', error: '#A23528' };
const VIBES = [
  ['Romance', 'heart'], ['Relax / chill', 'sun'], ['Foodie', 'utensils'],
  ['Outdoors', 'tree'], ['Art & culture', 'palette'], ['Custom', 'shuffle'],
];
const TIMES = [['45 min', 45], ['90 min', 90], ['2+ hours', 120], ['Custom', 'custom']];

let savedPreferences = null;

function Choice({ label, selected, disabled = false, onPress, style, children }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected, disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [styles.choice, selected && styles.selected, style, disabled && styles.disabled, pressed && styles.pressed]}>
    {children || <Text style={styles.choiceText}>{label}</Text>}
  </Pressable>;
}

export default function PreferencesScreen() {
  const router = useRouter();
  const [city, setCity] = useState(savedPreferences?.city ?? CITIES[0]);
  const [cityOpen, setCityOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [time, setTime] = useState(savedPreferences?.time ?? 90);
  const [customTime, setCustomTime] = useState(savedPreferences?.customTime ?? '');
  const [customVibe, setCustomVibe] = useState(savedPreferences?.customVibe ?? '');
  const [budget, setBudget] = useState(savedPreferences?.budget ?? '25');
  const [groupSize, setGroupSize] = useState(savedPreferences?.groupSize ?? 2);
  const [vibes, setVibes] = useState(savedPreferences?.vibes ?? ['Romance', 'Relax / chill']);
  const [travel, setTravel] = useState(savedPreferences?.travel ?? 'Walk');
  const [errors, setErrors] = useState({});
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null);
  const [verification, setVerification] = useState('');
  const generationInFlight = useRef(false);

  useEffect(() => {
    savedPreferences = { time, customTime, budget, groupSize, vibes, customVibe, travel, city };
  }, [time, customTime, budget, groupSize, vibes, customVibe, travel, city]);

  function toggleVibe(vibe) {
    setVibes(current => {
      if (current.includes(vibe)) return current.filter(item => item !== vibe);
      if (vibe === 'Custom') return ['Custom'];
      const regular = current.filter(item => item !== 'Custom');
      return regular.length < 2 ? [...regular, vibe] : regular;
    });
    setErrors(current => ({ ...current, vibe: undefined }));
  }

  async function buildQuest(surprise = false) {
    if (generationInFlight.current) return;
    Keyboard.dismiss();
    const minutes = time === 'custom' ? Number(customTime) : time;
    const dollars = Number(budget);
    const next = {};
    const selectedVibes = surprise ? [] : vibes.includes('Custom') ? [customVibe.trim()] : vibes;
    if (!surprise && vibes.includes('Custom') && !customVibe.trim()) next.vibe = 'Describe the kind of adventure you want.';
    if (!Number.isInteger(minutes) || minutes <= 0) next.time = 'Enter a whole number of minutes greater than zero.';
    if (!budget.trim() || !/^\d+(\.\d{1,2})?$/.test(budget.trim()) || !Number.isFinite(dollars)) next.budget = 'Enter a budget of $0 or more, with up to two decimal places.';
    setErrors(next);
    if (Object.keys(next).length) return;
    const preferences = { minutes: String(minutes), budget: String(dollars), groupSize: String(groupSize), vibes: surprise ? 'Surprise me' : selectedVibes.join(' + '), travel, city: city.name, startingLocation: city.label };
    generationInFlight.current = true;
    setGenerating(true);
    setGenerated(null);
    setVerification('');
    try {
      const adventure = await generateAdventure({
        mode: 'ai', lat: city.lat, lng: city.lng,
        timeMinutes: minutes, budget: dollars, groupSize,
        vibes: selectedVibes, travelMode: { Walk: 'walking', Bike: 'cycling', Drive: 'driving' }[travel],
      });
      if (typeof adventure.adventureId !== 'string' ||
          !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(adventure.adventureId)) {
        throw new Error('The backend did not return a valid adventureId. Check its response before generating again.');
      }
      setGenerated(adventure);
      setCurrentAdventure({ ...adventure, travel, preferences });
      console.info('[SideQuest] Backend adventure UUID:', adventure.adventureId);
      console.info('[SideQuest] Backend adventure response:', JSON.stringify(adventure));
      try {
        const saved = await getAdventure(adventure.adventureId);
        if (saved.adventureId !== adventure.adventureId) throw new Error('Saved adventure ID does not match.');
        setCurrentAdventure({ ...saved, travel, preferences });
        setVerification('Verified: loaded this adventure back from the backend.');
        console.info('[SideQuest] Saved adventure verified:', JSON.stringify(saved));
      } catch (error) {
        setVerification(`Backend returned this ID, but read-back verification failed: ${error.message}. Keep the ID; do not generate again just to retry verification.`);
      }
      router.push({ pathname: '/adventure', params: {
        adventureId: adventure.adventureId, minutes: String(minutes), budget: String(dollars),
        groupSize: String(groupSize), vibes: surprise ? 'Surprise me' : selectedVibes.join(' + '), travel, city: city.name, startingLocation: city.label,
      } });
    } catch (error) {
      setErrors(e => ({ ...e, generation: `${error.message || 'Unable to generate adventure.'} If the connection failed after submission, check the backend before retrying to avoid duplicates.` }));
    } finally {
      generationInFlight.current = false;
      setGenerating(false);
    }
  }

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <Pressable accessibilityRole="button" accessibilityLabel="Open menu" accessibilityState={{ expanded: menuOpen }} onPress={() => setMenuOpen(open => !open)} style={styles.logo}><Feather name="menu" size={21} color={C.ink} /></Pressable>
          <Text style={styles.brandName}>SideQuest</Text>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Open your passport" onPress={() => router.push('/passport')} style={styles.cityBadge}><Feather name="book-open" size={21} color={C.ink} /></Pressable>
      </View>
      {menuOpen && <View style={styles.menuPanel}>
        <Pressable accessibilityRole="button" onPress={() => { setMenuOpen(false); router.push('/passport'); }} style={styles.cityOption}><Feather name="book-open" size={18} color={C.ink} /><Text style={styles.cityOptionText}>Your passport</Text></Pressable>
        <Pressable accessibilityRole="button" onPress={() => { setMenuOpen(false); router.push('/adventure'); }} style={styles.cityOption}><Feather name="map" size={18} color={C.ink} /><Text style={styles.cityOptionText}>Current adventure</Text></Pressable>
      </View>}
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.introCard}>
          <View style={styles.introCopy}><Text style={styles.introKicker}>READY WHEN YOU ARE!</Text><Text accessibilityRole="header" style={styles.introTitle}>YOUR NEXT STORY{'\n'}STARTS HERE.</Text><Text style={styles.introCaption}>A little free time can become a lot of fun.</Text></View>
          <View style={styles.heroArt}><Text style={styles.coralSpark}>✦</Text><View style={styles.introSeal}><Text style={styles.mapEmoji}>🗺️</Text></View><Text style={styles.greenSpark}>✦</Text></View>
        </View>
        <Text style={[styles.heading, { marginBottom: 14 }]}>Where should we start?</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Starting location: ${city.label}. Choose a city`} accessibilityState={{ expanded: cityOpen }} onPress={() => setCityOpen(open => !open)} style={styles.location}>
          <View style={styles.locationIcon}><Feather name="target" size={21} color={C.ink} /></View>
          <View style={styles.flex}><Text style={styles.caption}>Starting location</Text><Text style={styles.locationTitle}>{city.label}</Text></View>
          <View style={styles.localBadge}><Feather name={cityOpen ? 'chevron-up' : 'chevron-down'} size={18} color={C.ink} /></View>
        </Pressable>
        {cityOpen && <View style={styles.cityMenu}>{CITIES.map(option => <Pressable key={option.id} accessibilityRole="button" accessibilityState={{ selected: city.id === option.id }} onPress={() => { setCity(option); setCityOpen(false); }} style={[styles.cityOption, city.id === option.id && styles.cityActive]}>
          <Feather name="map-pin" size={17} color={C.ink} /><Text style={styles.cityOptionText}>{option.label}</Text>{city.id === option.id && <Feather name="check" size={18} color={C.ink} />}
        </Pressable>)}</View>}
        <View style={{ height: 25 }} />

        <View style={styles.sectionHeading}><Text style={styles.heading}>How much time do you have?</Text><Text style={styles.hint}>Pick what fits</Text></View>
        <View style={styles.timeRow}>{TIMES.map(([label, value]) => <Choice key={label} label={label} selected={time === value} onPress={() => { setTime(value); setErrors(e => ({ ...e, time: undefined })); }} style={styles.timeChoice} />)}</View>
        {time === 'custom' && <View style={styles.customBox}>
          <Text style={styles.fieldLabel}>Your available time, in minutes</Text>
          <TextInput accessibilityLabel="Custom time in minutes" style={styles.input} value={customTime} onChangeText={setCustomTime} keyboardType="number-pad" placeholder="e.g. 75" placeholderTextColor={C.muted} maxLength={5} />
        </View>}
        {errors.time && <Text accessibilityRole="alert" style={styles.error}>{errors.time}</Text>}

        <View style={styles.twoColumns}>
          <View style={[styles.fieldCard, errors.budget && styles.invalid]}>
            <Text style={styles.fieldLabel}>What’s the budget?</Text>
            <View style={styles.budgetRow}><Text style={styles.currency}>$</Text><TextInput accessibilityLabel="Total budget in Canadian dollars" style={[styles.input, styles.budgetInput]} value={budget} onChangeText={setBudget} keyboardType="decimal-pad" placeholder="25" placeholderTextColor={C.muted} maxLength={9} selectTextOnFocus /><Text style={styles.cad}>CAD</Text></View>
            <Text style={styles.smallHint}>Total for your group</Text>
          </View>
          <View style={styles.fieldCard}>
            <Text style={styles.fieldLabel}>Who’s joining?</Text>
            <View style={styles.stepper}>
              <Pressable accessibilityRole="button" accessibilityLabel="Remove one person" accessibilityState={{ disabled: groupSize === 1 }} disabled={groupSize === 1} onPress={() => setGroupSize(n => n - 1)} style={[styles.stepButton, groupSize === 1 && styles.disabled]}><Feather name="minus" size={18} color={C.ink} /></Pressable>
              <Text accessibilityLiveRegion="polite" style={styles.groupNumber}>{groupSize}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel="Add one person" onPress={() => setGroupSize(n => n + 1)} style={styles.stepButton}><Feather name="plus" size={18} color={C.ink} /></Pressable>
            </View>
            <Text style={styles.smallHint}>Including you</Text>
          </View>
        </View>
        {errors.budget && <Text accessibilityRole="alert" style={styles.error}>{errors.budget}</Text>}

        <View style={styles.sectionHeading}><Text style={styles.heading}>What’s today’s vibe?</Text><View style={styles.vibeHint}><Text style={styles.hint}>Choose your vibe!</Text><Text style={styles.counter}>{vibes.includes('Custom') ? 'Custom' : `${vibes.length}/2`}</Text></View></View>
        <View style={styles.vibeGrid}>{VIBES.map(([label, icon]) => <Choice key={label} label={label} selected={vibes.includes(label)} disabled={label !== 'Custom' && !vibes.includes(label) && !vibes.includes('Custom') && vibes.length >= 2} onPress={() => toggleVibe(label)} style={[styles.vibe, vibes.includes(label) && styles.vibeSelected]}>
          <PreferenceIcon name={icon} size={22} color={C.ink} /><Text style={styles.vibeText}>{label}</Text>
        </Choice>)}</View>

        {vibes.includes('Custom') && <View style={styles.customBox}>
          <Text style={styles.fieldLabel}>What are you in the mood for?</Text>
          <TextInput accessibilityLabel="Custom adventure vibe" value={customVibe} onChangeText={setCustomVibe} placeholder="e.g. hidden bookstores and cozy cafés" placeholderTextColor={C.muted} maxLength={200} multiline style={[styles.input, { fontSize: 15 }]} />
        </View>}
        {errors.vibe && <Text accessibilityRole="alert" style={styles.error}>{errors.vibe}</Text>}
        <Pressable accessibilityRole="button" accessibilityState={{ disabled: generating, busy: generating }} disabled={generating} onPress={() => buildQuest(true)} style={({ pressed }) => [styles.surprise, pressed && styles.pressed, generating && styles.disabled]}>
          <PreferenceIcon name="sparkles" size={21} color={C.ink} /><Text style={styles.vibeText}>Surprise me!</Text>
        </Pressable>
        <Text style={[styles.heading, styles.travelHeading]}>How do you want to explore?</Text>
        <View style={styles.travelRow}>{['Walk', 'Bike', 'Drive'].map(mode => <Motion key={mode} trigger={travel === mode} style={styles.flex}><Choice label={mode} selected={travel === mode} onPress={() => setTravel(mode)} style={styles.travelChoice} /></Motion>)}</View>
        {errors.generation && <Text accessibilityRole="alert" style={styles.error}>{errors.generation}</Text>}
        {generated && <View style={styles.result}>
          <Text style={styles.fieldLabel}>Backend adventure UUID · hold to copy</Text>
          <Text selectable style={styles.uuid}>{generated.adventureId}</Text>
          <Text accessibilityLiveRegion="polite" style={styles.resultNote}>{verification || 'Checking saved adventure…'}</Text>
        </View>}
        <Text style={styles.resultNote}>Current backend: vibes are not applied and routing uses walking.</Text>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.buttonShadow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Build my quest using the backend" accessibilityState={{ disabled: generating, busy: generating }} disabled={generating} onPress={() => buildQuest()} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}>
            <Text style={styles.primaryText}>{generating ? 'Building your quest…' : 'Build my quest'}</Text><Feather name="arrow-right" size={23} color={C.ink} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  cityMenu: { borderWidth: 1, borderColor: '#D5DEDA', borderRadius: 18, padding: 6, marginTop: 6, backgroundColor: '#FFFFFF' },
  cityOption: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, minHeight: 48, borderRadius: 12 }, cityOptionText: { color: C.ink, fontSize: 14, flex: 1 }, cityActive: { backgroundColor: C.pale },
  menuPanel: { marginHorizontal: 24, borderRadius: 18, backgroundColor: C.pale, marginBottom: 12 },
  heroArt: { width: 88, height: 112, alignItems: 'flex-end', justifyContent: 'center' }, mapEmoji: { fontSize: 29, transform: [{ rotate: '6deg' }] }, coralSpark: { position: 'absolute', top: 0, left: -6, color: '#FF765B', fontSize: 20 }, greenSpark: { position: 'absolute', bottom: 0, left: -8, color: C.ink, fontSize: 18 },
  vibeHint: { flexDirection: 'row', alignItems: 'center', gap: 8 }, counter: { color: C.ink, backgroundColor: C.pale, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5, fontWeight: '800', fontSize: 10 },
  surprise: { flexDirection: 'row', gap: 12, justifyContent: 'center', alignItems: 'center', minHeight: 62, backgroundColor: '#F5F9DE', borderWidth: 1, borderStyle: 'dashed', borderColor: '#A7BA8D', borderRadius: 19, marginTop: 12 },
  introCard: { borderWidth: 1, borderColor: '#D5DEDA', borderRadius: 26, backgroundColor: '#FFFFFF', padding: 20, marginBottom: 26, flexDirection: 'row', gap: 12, alignItems: 'center' },
  introCopy: { flex: 1 }, introKicker: { fontSize: 9, letterSpacing: 1.4, color: C.muted, fontWeight: '800', marginBottom: 8 },
  introTitle: { fontSize: 24, lineHeight: 26, fontWeight: '900', color: C.ink, letterSpacing: -0.8 },
  introCaption: { color: C.muted, fontSize: 11, lineHeight: 17, marginTop: 12 },
  introSeal: { width: 62, height: 62, borderRadius: 31, borderWidth: 1, borderColor: C.ink, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center', shadowColor: C.lime, shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 6, height: 7 } },
  result: { borderWidth: 1, borderColor: C.ink, borderRadius: 12, padding: 10, marginBottom: 8 },
  uuid: { color: C.ink, fontSize: 13, fontWeight: '600' },
  resultNote: { color: C.muted, fontSize: 11, lineHeight: 16, marginBottom: 8 },
  safe: { flex: 1, backgroundColor: C.paper }, flex: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  brandName: { color: C.ink, fontSize: 20, fontWeight: '600', letterSpacing: -0.5 },
  cityBadge: { width: 46, height: 46, borderRadius: 23, shadowColor: C.ink, shadowOpacity: 0.18, shadowRadius: 0, shadowOffset: { width: 4, height: 5 }, borderWidth: 1, borderColor: '#D5DEDA', backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: '#D5DEDA', borderRadius: 22, padding: 16, backgroundColor: '#FFFFFF' },
  locationIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center' },
  caption: { fontSize: 11, color: C.muted, marginBottom: 5 },
  locationTitle: { fontSize: 16, fontWeight: '700', color: C.ink },
  localBadge: { width: 34, height: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: C.pale, borderRadius: 11 },
  localText: { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: C.ink },
  locationNote: { fontSize: 12, color: C.muted, marginTop: 9, marginBottom: 25 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 5, marginBottom: 13 },
  heading: { fontSize: 17, color: C.ink, fontWeight: '700' }, hint: { color: C.muted, fontSize: 13 },
  timeRow: { flexDirection: 'row', gap: 7, marginBottom: 16 },
  choice: { borderWidth: 1, borderColor: '#D5DEDA', backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: C.lime, borderColor: C.lime }, pressed: { opacity: 0.7 },
  choiceText: { color: C.ink, fontSize: 13, fontWeight: '500' },
  timeChoice: { flex: 1, minHeight: 52, borderRadius: 28, paddingVertical: 12, paddingHorizontal: 3 },
  customBox: { borderWidth: 1, borderColor: C.line, borderRadius: 18, padding: 14, marginVertical: 12 },
  twoColumns: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  fieldCard: { flex: 1, borderWidth: 1, borderColor: '#D5DEDA', backgroundColor: '#FFFFFF', borderRadius: 22, paddingHorizontal: 12, paddingTop: 17, paddingBottom: 12 },
  fieldLabel: { color: C.muted, fontSize: 12, marginBottom: 8 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 4 },
  currency: { color: C.ink, fontSize: 18 }, input: { color: C.ink, fontSize: 22, minHeight: 44, paddingVertical: 4 },
  budgetInput: { flex: 1, minWidth: 0 }, cad: { color: C.muted, fontSize: 10 },
  smallHint: { fontSize: 10, color: C.muted, marginTop: 5 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3 },
  stepButton: { width: 44, height: 44, backgroundColor: C.pale, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  groupNumber: { color: C.ink, fontSize: 22, flexShrink: 1 }, disabled: { opacity: 0.35 },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vibe: { width: '48%', flexGrow: 1, minHeight: 72, borderRadius: 22, flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 16, gap: 10 },
  vibeSelected: { backgroundColor: C.pale, borderColor: C.ink, borderWidth: 1.5 },
  vibeText: { color: C.ink, fontSize: 14, fontWeight: '500', flexShrink: 1 },
  travelHeading: { marginTop: 23, marginBottom: 14 },
  travelRow: { flexDirection: 'row', borderWidth: 1, borderColor: '#D5DEDA', padding: 5, borderRadius: 20, gap: 4 },
  travelChoice: { flex: 1, minHeight: 44, borderWidth: 0, borderRadius: 13, paddingVertical: 10 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12, backgroundColor: C.paper },
  buttonShadow: { borderRadius: 24 },
  primaryButton: { backgroundColor: C.lime, borderRadius: 24, minHeight: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 15 },
  primaryPressed: { transform: [{ translateX: 2 }, { translateY: 3 }] },
  primaryText: { fontSize: 20, fontWeight: '800', color: C.ink, letterSpacing: -0.5 },
  error: { color: C.error, fontSize: 12, marginBottom: 15, lineHeight: 18 }, invalid: { borderColor: C.error },
});
