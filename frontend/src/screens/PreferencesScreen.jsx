import { useState } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Feather from '@expo/vector-icons/Feather';

const C = { paper: '#FFFEFA', ink: '#173E39', lime: '#D6F65B', pale: '#F0F4D5', muted: '#6B817B', line: '#D9E0D6', shadow: '#12322E', error: '#A23528' };
const VIBES = [
  ['Romance', 'heart'], ['Relax / chill', 'sun'], ['Foodie', 'coffee'],
  ['Outdoors', 'wind'], ['Art & culture', 'edit-3'], ['Surprise me', 'shuffle'],
];
const TIMES = [['45 min', 45], ['90 min', 90], ['2+ hours', 120], ['Custom', 'custom']];

function Choice({ label, selected, onPress, style, children }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected }} onPress={onPress}
    style={({ pressed }) => [styles.choice, selected && styles.selected, style, pressed && styles.pressed]}>
    {children || <Text style={styles.choiceText}>{label}</Text>}
  </Pressable>;
}

export default function PreferencesScreen() {
  const [time, setTime] = useState(90);
  const [customTime, setCustomTime] = useState('');
  const [budget, setBudget] = useState('25');
  const [groupSize, setGroupSize] = useState(2);
  const [vibes, setVibes] = useState(['Romance', 'Relax / chill']);
  const [travel, setTravel] = useState('Walk');
  const [errors, setErrors] = useState({});

  function toggleVibe(vibe) {
    setVibes(current => vibe === 'Surprise me'
      ? current.includes(vibe) ? [] : [vibe]
      : current.includes(vibe) ? current.filter(item => item !== vibe)
        : [...current.filter(item => item !== 'Surprise me'), vibe]);
  }

  function previewQuest() {
    Keyboard.dismiss();
    const minutes = time === 'custom' ? Number(customTime) : time;
    const dollars = Number(budget);
    const next = {};
    if (!Number.isInteger(minutes) || minutes <= 0) next.time = 'Enter a whole number of minutes greater than zero.';
    if (!budget.trim() || !/^\d+(\.\d{1,2})?$/.test(budget.trim()) || !Number.isFinite(dollars)) next.budget = 'Enter a budget of $0 or more, with up to two decimal places.';
    setErrors(next);
    if (Object.keys(next).length) return;
    Alert.alert('Your quest preferences',
      `Fredericton, NB\n${minutes} minutes · $${dollars.toFixed(2)} CAD total · ${groupSize} ${groupSize === 1 ? 'person' : 'people'}\n${vibes.length ? vibes.join(' + ') : 'Open to any vibe'} · ${travel}\n\nThis is a design preview. No adventure has been generated yet.`,
      [{ text: 'Keep exploring', style: 'cancel' }]);
  }

  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    <StatusBar style="dark" />
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.logo}><Feather name="zap" size={23} color={C.ink} /></View>
          <Text style={styles.brandName}>SideQuest</Text>
        </View>
        <View style={styles.cityBadge}><Feather name="compass" size={21} color={C.ink} /></View>
      </View>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
        <View style={styles.location}>
          <View style={styles.locationIcon}><Feather name="map-pin" size={22} color={C.ink} /></View>
          <View style={styles.flex}><Text style={styles.caption}>YOUR STARTING POINT</Text><Text style={styles.locationTitle}>Fredericton, NB</Text></View>
          <View style={styles.localBadge}><Text style={styles.localText}>LOCAL</Text></View>
        </View>
        <Text style={styles.locationNote}>Little adventures, close to home.</Text>

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

        <View style={styles.sectionHeading}><Text style={styles.heading}>What’s today’s vibe?</Text><Text style={styles.hint}>Mix and match</Text></View>
        <View style={styles.vibeGrid}>{VIBES.map(([label, icon]) => <Choice key={label} label={label} selected={vibes.includes(label)} onPress={() => toggleVibe(label)} style={[styles.vibe, vibes.includes(label) && styles.vibeSelected]}>
          <Feather name={icon} size={21} color={C.ink} /><Text style={styles.vibeText}>{label}</Text>
        </Choice>)}</View>

        <Text style={[styles.heading, styles.travelHeading]}>How do you want to explore?</Text>
        <View style={styles.travelRow}>{['Walk', 'Bike', 'Drive'].map(mode => <Choice key={mode} label={mode} selected={travel === mode} onPress={() => setTravel(mode)} style={styles.travelChoice} />)}</View>
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.buttonShadow}>
          <Pressable accessibilityRole="button" accessibilityLabel="Build my quest, preview preferences" onPress={previewQuest} style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryPressed]}>
            <Text style={styles.primaryText}>Build my quest</Text><Feather name="arrow-right" size={23} color={C.ink} />
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper }, flex: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  logo: { width: 42, height: 42, borderRadius: 14, borderWidth: 1.8, borderColor: C.ink, backgroundColor: C.lime, alignItems: 'center', justifyContent: 'center', shadowColor: C.ink, shadowOffset: { width: 3, height: 3 }, shadowOpacity: 0.23, shadowRadius: 0, elevation: 2 },
  brandName: { color: C.ink, fontSize: 21, fontWeight: '500', letterSpacing: -0.5 },
  cityBadge: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.8, borderColor: C.ink, backgroundColor: C.pale, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 24, paddingBottom: 24 },
  location: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderColor: C.line, paddingBottom: 13 },
  locationIcon: { width: 38, height: 42, alignItems: 'center', justifyContent: 'center' },
  caption: { fontSize: 10, letterSpacing: 1.3, color: C.muted, marginBottom: 5, fontWeight: '600' },
  locationTitle: { fontSize: 18, fontWeight: '600', color: C.ink },
  localBadge: { paddingHorizontal: 9, paddingVertical: 6, backgroundColor: C.pale, borderRadius: 7 },
  localText: { fontSize: 9, fontWeight: '700', letterSpacing: 1, color: C.ink },
  locationNote: { fontSize: 12, color: C.muted, marginTop: 9, marginBottom: 25 },
  sectionHeading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 5, marginBottom: 13 },
  heading: { fontSize: 16, color: C.ink, fontWeight: '500' }, hint: { color: C.muted, fontSize: 13 },
  timeRow: { flexDirection: 'row', gap: 7, marginBottom: 16 },
  choice: { borderWidth: 1.8, borderColor: C.ink, backgroundColor: C.paper, alignItems: 'center', justifyContent: 'center' },
  selected: { backgroundColor: C.lime }, pressed: { opacity: 0.7 },
  choiceText: { color: C.ink, fontSize: 13, fontWeight: '500' },
  timeChoice: { flex: 1, minHeight: 48, borderRadius: 26, paddingVertical: 10, paddingHorizontal: 3 },
  customBox: { borderWidth: 1.8, borderColor: C.ink, borderRadius: 18, padding: 14, marginBottom: 16 },
  twoColumns: { flexDirection: 'row', gap: 10, marginBottom: 22 },
  fieldCard: { flex: 1, borderWidth: 1.8, borderColor: C.ink, borderRadius: 18, paddingHorizontal: 12, paddingTop: 15, paddingBottom: 10 },
  fieldLabel: { color: C.muted, fontSize: 12, marginBottom: 8 },
  budgetRow: { flexDirection: 'row', alignItems: 'center', minHeight: 44, gap: 4 },
  currency: { color: C.ink, fontSize: 18 }, input: { color: C.ink, fontSize: 22, minHeight: 44, paddingVertical: 4 },
  budgetInput: { flex: 1, minWidth: 0 }, cad: { color: C.muted, fontSize: 10 },
  smallHint: { fontSize: 10, color: C.muted, marginTop: 5 },
  stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3 },
  stepButton: { width: 44, height: 44, backgroundColor: C.pale, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  groupNumber: { color: C.ink, fontSize: 22, flexShrink: 1 }, disabled: { opacity: 0.35 },
  vibeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  vibe: { width: '48%', flexGrow: 1, minHeight: 66, borderRadius: 18, flexDirection: 'row', paddingHorizontal: 8, paddingVertical: 14, gap: 9 },
  vibeSelected: { backgroundColor: C.pale, borderWidth: 2.5 },
  vibeText: { color: C.ink, fontSize: 13, flexShrink: 1 },
  travelHeading: { marginTop: 23, marginBottom: 14 },
  travelRow: { flexDirection: 'row', borderWidth: 1.8, borderColor: C.ink, padding: 5, borderRadius: 18, gap: 4 },
  travelChoice: { flex: 1, minHeight: 44, borderWidth: 0, borderRadius: 13, paddingVertical: 10 },
  footer: { paddingHorizontal: 24, paddingTop: 12, paddingBottom: 12, backgroundColor: C.paper },
  buttonShadow: { backgroundColor: C.shadow, borderRadius: 24, paddingBottom: 5, paddingRight: 4 },
  primaryButton: { backgroundColor: C.lime, borderWidth: 1.8, borderColor: C.ink, borderRadius: 23, minHeight: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, padding: 15 },
  primaryPressed: { transform: [{ translateX: 2 }, { translateY: 3 }] },
  primaryText: { fontSize: 20, fontWeight: '800', color: C.ink, letterSpacing: -0.5 },
  error: { color: C.error, fontSize: 12, marginBottom: 15, lineHeight: 18 }, invalid: { borderColor: C.error },
});
