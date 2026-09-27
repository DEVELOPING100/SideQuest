import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { getPhotoMemory, savePhotoMemory } from '../data/photoMemories';

export default function PhotoMemoryPicker({ adventureId, stopId, title }) {
  const [photo, setPhoto] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState('');
  const [settingsNeeded, setSettingsNeeded] = useState(false);
  const active = useRef(false);
  const pending = useRef(false);

  useEffect(() => {
    active.current = true;
    getPhotoMemory(adventureId, stopId)
      .then(value => { if (active.current) setPhoto(value); })
      .catch(() => { if (active.current) setError('Could not load this photo. Try choosing one again.'); })
      .finally(() => { if (active.current) setBusy(false); });
    return () => { active.current = false; };
  }, [adventureId, stopId]);

  async function pickPhoto(camera) {
    if (pending.current || busy) return;
    pending.current = true;
    setBusy(true);
    setError('');
    setSettingsNeeded(false);
    try {
      if (camera) {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          if (active.current) {
            setError('Allow camera access to take a photo, or choose an existing photo.');
            setSettingsNeeded(!permission.canAskAgain);
          }
          return;
        }
      }
      const options = { mediaTypes: ['images'], quality: 0.8, allowsEditing: false };
      const result = camera ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      if (result.canceled || !result.assets?.[0]) return;
      const memory = await savePhotoMemory({ adventureId, stopId, title, uri: result.assets[0].uri });
      if (active.current) setPhoto(memory);
    } catch {
      if (active.current) setError('Could not save your photo. Please try again.');
    } finally {
      pending.current = false;
      if (active.current) setBusy(false);
    }
  }

  return <View style={styles.box}>
    <Text style={styles.heading}>{photo ? 'Your photo memory' : 'Add a photo memory'}</Text>
    <Text style={styles.note}>Optional · saved on this phone, shown in your passport</Text>
    {photo && <Image source={{ uri: photo.uri }} style={styles.photo} accessibilityLabel={`Photo memory at ${title}`} />}
    <View style={styles.buttons}>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => pickPhoto(true)} style={[styles.button, busy && styles.disabled]}><Text style={styles.label}>{photo ? 'Retake photo' : 'Take photo'}</Text></Pressable>
      <Pressable accessibilityRole="button" disabled={busy} onPress={() => pickPhoto(false)} style={[styles.button, styles.secondary, busy && styles.disabled]}><Text style={styles.label}>Choose photo</Text></Pressable>
      {busy && <ActivityIndicator color="#173E39" />}
    </View>
    {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
    {settingsNeeded && <Pressable accessibilityRole="button" onPress={() => Linking.openSettings().catch(() => setError('Open your phone settings to allow camera access.'))} style={styles.button}><Text style={styles.label}>Open settings</Text></Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  box: { backgroundColor: '#F5F9DF', borderWidth: 1, borderStyle: 'dashed', borderColor: '#A5B58A', borderRadius: 18, padding: 14, marginBottom: 20, gap: 8 },
  heading: { color: '#173E39', fontSize: 15, fontWeight: '700' },
  note: { color: '#6B817B', fontSize: 11, lineHeight: 16 },
  photo: { width: '100%', aspectRatio: 4 / 3, borderRadius: 10 },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' },
  button: { minHeight: 44, justifyContent: 'center', backgroundColor: '#D1FF4A', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10 },
  secondary: { backgroundColor: '#FFFFFF', borderColor: '#D5DEDA', borderWidth: 1 },
  label: { color: '#173E39', fontSize: 12, fontWeight: '700' },
  disabled: { opacity: 0.5 },
  error: { color: '#A23528', fontSize: 12, lineHeight: 18 },
});
