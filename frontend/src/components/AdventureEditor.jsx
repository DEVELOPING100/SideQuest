import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { generateAdventure, getAdventure, getNearbyPlaces } from '../api';
import { loadPlanningNotes, savePlanningNotes } from '../data/planningNotes';
import AdventureMap from './AdventureMap';
import DraggableActivity from './DraggableActivity';

// Real stops use the existing API. Custom notes are saved only on this phone.
export default function AdventureEditor({ adventure, preferences, travel, onClose, onSaved, onUnavailable }) {
  const [places, setPlaces] = useState([]);
  const [draft, setDraft] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [adding, setAdding] = useState(false);
  const [replacing, setReplacing] = useState(null);
  const [custom, setCustom] = useState(false);
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('20');
  const [description, setDescription] = useState('');
  const [formError, setFormError] = useState('');
  const [dragging, setDragging] = useState(false);
  const pending = useRef(false);
  const layouts = useRef({});
  const originalIds = useRef([]);
  const created = useRef(null);
  const request = {
    lat: adventure.stops[0].lat, lng: adventure.stops[0].lng,
    budget: Number(preferences.budget || 25), timeMinutes: Number(preferences.minutes || 90),
    groupSize: Number(preferences.groupSize || 2),
  };

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true); setError('');
      try {
        const data = await getNearbyPlaces(request);
        if (!Array.isArray(data.places)) throw new Error('Activity choices could not be loaded.');
        const selected = adventure.stops.map(stop => {
          const matches = data.places.filter(place => place.name === stop.name
            && Math.abs(place.lat - stop.lat) < 0.00001 && Math.abs(place.lng - stop.lng) < 0.00001);
          if (matches.length !== 1) throw new Error(`Cannot safely edit ${stop.name}: its activity is not in the catalog.`);
          return matches[0];
        });
        const notes = await loadPlanningNotes(adventure.adventureId);
        const restored = [...selected];
        notes.sort((a, b) => a.position - b.position).forEach(note => restored.splice(Math.min(note.position, restored.length), 0, note));
        if (active) {
          originalIds.current = selected.map(item => item.placeId);
          setPlaces(data.places); setDraft(restored);
        }
      } catch (err) {
        if (active) {
          // Catalog or local-storage problems must never block the saved quest.
          if (onUnavailable) onUnavailable();
          else setError(err.message || 'Could not load activities.');
        }
      }
      finally { if (active) setLoading(false); }
    }
    load();
    return () => { active = false; };
    // The parent keys this editor by adventure ID; retry reloads this draft.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  function move(index, dy, direction) {
    const row = layouts.current[draft[index].placeId];
    if (!row) return;
    const center = row.y + row.height / 2 + dy;
    let destination = direction ? Math.max(0, Math.min(draft.length - 1, index + direction)) : 0;
    if (!direction) draft.forEach((item, i) => {
      const measured = layouts.current[item.placeId];
      if (i !== index && measured && center > measured.y + measured.height / 2) destination++;
    });
    setDraft(items => {
      const next = [...items];
      next.splice(destination, 0, next.splice(index, 1)[0]);
      return next;
    });
  }

  function open(item = null) {
    setReplacing(item); setCustom(!!item?.custom); setName(item?.custom ? item.name : '');
    setDuration(String(item?.estimatedMinutes || 20)); setDescription(item?.description || '');
    setFormError(''); setAdding(true);
  }
  function choose(item) {
    setDraft(items => replacing ? items.map(old => old.placeId === replacing.placeId ? item : old) : [...items, item]);
    setAdding(false);
  }
  function addNote() {
    const minutes = Number(duration);
    if (!name.trim() || !Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
      setFormError('Enter a name and a whole number of minutes between 1 and 1440.'); return;
    }
    choose({ placeId: replacing?.custom ? replacing.placeId : `note-${Date.now()}`, custom: true,
      name: name.trim(), estimatedMinutes: minutes, description: description.trim(), category: 'Local planning note' });
  }

  async function save() {
    const ids = draft.filter(item => !item.custom).map(item => item.placeId);
    if (pending.current || ids.length < 2) return;
    pending.current = true; setSaving(true); setError('');
    try {
      const existing = await getAdventure(adventure.adventureId);
      if (existing.stops.some(stop => stop.completed)) throw new Error('This quest has already started. Return to its saved route to continue.');
      const fingerprint = JSON.stringify(ids);
      let revised = existing;
      if (fingerprint !== JSON.stringify(originalIds.current)) {
        if (created.current?.fingerprint === fingerprint) revised = created.current.adventure;
        else {
          revised = await generateAdventure({ ...request, mode: 'manual', selectedPlaceIds: ids,
            vibes: preferences.vibes ? preferences.vibes.split(' + ') : [],
            travelMode: { Walk: 'walking', Bike: 'cycling', Drive: 'driving' }[travel] || 'walking' });
          if (!revised.adventureId || !Array.isArray(revised.stops) || revised.stops.length !== ids.length) throw new Error('Unexpected saved quest response. Check saved adventures before retrying.');
          created.current = { fingerprint, adventure: revised };
        }
      }
      await savePlanningNotes(revised.adventureId, draft);
      onSaved(revised);
    } catch (err) { setError(err.message || 'Could not save. Please try again.'); }
    finally { pending.current = false; setSaving(false); }
  }

  const providedCount = draft.filter(item => !item.custom).length;
  const available = places.filter(place => !draft.some(item => item.placeId === place.placeId) || replacing?.placeId === place.placeId);
  const mapStops = draft.filter(item => !item.custom).map(item => ({ ...item, id: item.placeId, coordinate: { latitude: item.lat, longitude: item.lng } }));
  const canChooseCustom = !replacing || replacing.custom || providedCount > 2;
  return <SafeAreaView style={s.safe}>
    <View style={s.header}><Pressable accessibilityRole="button" disabled={saving} onPress={onClose} style={s.small}><Text style={s.label}>Back</Text></Pressable><Text style={s.headerTitle}>Your quest is ready!</Text></View>
    <ScrollView scrollEnabled={!dragging && !saving} contentContainerStyle={s.content}>
      {loading && <ActivityIndicator style={s.loading} color="#173E39" />}
      {!loading && places.length > 0 && <>
        <AdventureMap stops={mapStops} travel={travel} city={preferences.city} />
        <View style={s.card}>
          <Text style={s.eyebrow}>SIDEQUEST PICK · BUILT AROUND YOUR DAY</Text>
          <Text style={s.title}>{adventure.title}</Text>
          <Text style={s.summary}>{providedCount} stops shaped around {preferences.minutes} minutes, {preferences.groupSize} people, and a ${preferences.budget} budget.</Text>
          <View style={s.pill}><Text style={s.note}>Starting near <Text style={s.label}>{preferences.startingLocation || preferences.city}</Text></Text></View>
          <Text style={s.hint}>Hold a numbered handle, then drag to reorder.</Text>
          <View>{draft.map((item, index) => <DraggableActivity key={item.placeId} item={item} index={index} disabled={saving} canRemove={item.custom || providedCount > 2}
            onEdit={() => open(item)} onRemove={() => setDraft(items => items.filter(old => old.placeId !== item.placeId))}
            onDrop={(dy, direction) => move(index, dy, direction)} onDragging={setDragging}
            onLayout={event => { layouts.current[item.placeId] = event.nativeEvent.layout; }} />)}</View>
          <Pressable accessibilityRole="button" disabled={saving} onPress={() => open()} style={s.add}><Text style={s.label}>+ Add an activity</Text></Pressable>
          <Text style={s.hint}>Keep at least two provided stops. Custom notes stay on this phone and do not earn stamps or appear in check-in.</Text>
          <Text style={s.hint}>Changing provided stops saves a revised quest when you tap Let&apos;s go.</Text>
        </View>
      </>}
      {!!error && <View style={s.errorBox}><Text accessibilityRole="alert" style={s.error}>{error}</Text>
        {!places.length && !loading && <Pressable accessibilityRole="button" onPress={() => setAttempt(n => n + 1)} style={s.small}><Text style={s.label}>Retry loading activities</Text></Pressable>}</View>}
    </ScrollView>
    <View style={s.footer}><Pressable accessibilityRole="button" disabled={saving || loading || providedCount < 2} onPress={save} style={[s.go, (saving || loading || providedCount < 2) && s.disabled]}>
      {saving ? <ActivityIndicator color="#173E39" /> : <Text style={s.goText}>Let&apos;s go →</Text>}
    </Pressable></View>
    <Modal visible={adding} animationType="slide" onRequestClose={() => setAdding(false)}>
      <SafeAreaProvider><SafeAreaView style={s.safe}><View style={s.header}><Text style={s.headerTitle}>{replacing ? 'Edit activity' : 'Add an activity'}</Text></View>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.modalContent}>
          <View style={s.tabs}><Pressable accessibilityRole="button" onPress={() => setCustom(false)} style={[s.tab, !custom && s.selected]}><Text style={s.tabLabel}>Provided activities</Text></Pressable><Pressable accessibilityRole="button" disabled={!canChooseCustom} onPress={() => setCustom(true)} style={[s.tab, custom && s.selected, !canChooseCustom && s.disabled]}><Text style={s.tabLabel}>Custom note</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setAdding(false)} style={s.tab}><Text style={s.tabLabel}>Done</Text></Pressable></View>
          {custom ? <>
            <Text style={s.note}>A personal planning note, saved on this phone. No check-in or stamp.</Text>
            <Text style={s.label}>Activity name</Text><TextInput accessibilityLabel="Activity name" value={name} onChangeText={setName} maxLength={100} style={s.input} />
            <Text style={s.label}>Minutes</Text><TextInput accessibilityLabel="Activity minutes" value={duration} onChangeText={setDuration} keyboardType="number-pad" maxLength={4} style={s.input} />
            <Text style={s.label}>Notes (optional)</Text><TextInput accessibilityLabel="Activity notes" value={description} onChangeText={setDescription} maxLength={500} multiline style={s.input} />
            {!!formError && <Text accessibilityRole="alert" style={s.error}>{formError}</Text>}
            <Pressable accessibilityRole="button" onPress={addNote} style={s.add}><Text style={s.label}>Save custom note</Text></Pressable>
          </> : <>{available.map(item => <Pressable accessibilityRole="button" key={item.placeId} onPress={() => choose(item)} style={s.option}><Text style={s.label}>{item.name}</Text><Text style={s.note}>{item.description}</Text><Text style={s.note}>{item.estimatedMinutes} min · ${item.estimatedCost || 0}</Text></Pressable>)}{!available.length && <Text style={s.note}>All provided activities are already in this quest.</Text>}</>}
        </ScrollView>
      </SafeAreaView></SafeAreaProvider>
    </Modal>
  </SafeAreaView>;
}

const s = StyleSheet.create({
  tab: { flexShrink: 1, backgroundColor: '#F0F4D5', minHeight: 44, paddingHorizontal: 10, paddingVertical: 12, justifyContent: 'center', borderRadius: 12 },
  tabLabel: { color: '#173E39', fontSize: 11, fontWeight: '700', textAlign: 'center' },
  safe: { flex: 1, backgroundColor: '#FFFDFA' }, content: { paddingBottom: 20 }, loading: { margin: 40 },
  header: { paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 16 }, headerTitle: { color: '#173E39', fontSize: 18, fontWeight: '700', flex: 1 },
  card: { marginHorizontal: 20, marginTop: -24, padding: 18, borderWidth: 1, borderColor: '#D5DEDA', borderTopLeftRadius: 28, borderTopRightRadius: 28, backgroundColor: '#FFFDFA' },
  eyebrow: { color: '#173E39', fontSize: 9, letterSpacing: 1.5, lineHeight: 16, marginTop: 8 }, title: { color: '#173E39', fontSize: 29, fontWeight: '800', letterSpacing: -0.8, marginTop: 14 },
  summary: { color: '#6B817B', fontSize: 15, lineHeight: 23, marginTop: 12 }, pill: { alignSelf: 'flex-start', backgroundColor: '#EFF2ED', borderRadius: 10, padding: 9, marginTop: 16 },
  note: { color: '#6B817B', fontSize: 12, lineHeight: 19 }, hint: { color: '#6B817B', fontSize: 11, lineHeight: 17, marginTop: 14 }, label: { color: '#173E39', fontSize: 12, fontWeight: '700' },
  small: { backgroundColor: '#F0F4D5', minHeight: 44, padding: 12, justifyContent: 'center', borderRadius: 12 },
  add: { borderWidth: 1, borderStyle: 'dashed', borderColor: '#9BAD80', backgroundColor: '#F0F4D5', borderRadius: 18, padding: 19, alignItems: 'center', marginTop: 20 },
  footer: { paddingHorizontal: 20, paddingVertical: 14 }, go: { minHeight: 65, backgroundColor: '#D1FF4A', borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, goText: { color: '#173E39', fontSize: 22, fontWeight: '800' },
  modalContent: { padding: 20, gap: 14 }, tabs: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 }, selected: { backgroundColor: '#D1FF4A' }, input: { borderWidth: 1, borderColor: '#D5DEDA', borderRadius: 12, padding: 14, color: '#173E39', minHeight: 48 },
  option: { borderWidth: 1, borderColor: '#D5DEDA', borderRadius: 16, padding: 16, gap: 6 }, errorBox: { padding: 20, gap: 12 }, error: { color: '#A23528', lineHeight: 21 }, disabled: { opacity: 0.4 },
});
