import { useCallback, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { getPhotoMemories } from '../data/photoMemories';

export default function PassportPhotos() {
  const [photos, setPhotos] = useState([]);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  useFocusEffect(useCallback(() => {
    let active = true;
    setError('');
    getPhotoMemories().then(items => { if (active) setPhotos(items); })
      .catch(() => { if (active) setError('Could not load photos saved on this phone.'); });
    return () => { active = false; };
    // The retry counter deliberately reloads local photos.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]));

  return <View style={styles.section}>
    <Text style={styles.kicker}>STAMP PHOTOS</Text>
    <Text style={styles.heading}>{photos.length ? `${photos.length} moments, each with its own story` : 'Your next memory is waiting'}</Text>
    <Text style={styles.note}>Saved on this phone · one photo per stop</Text>
    {!!error && <Pressable accessibilityRole="button" onPress={() => setAttempt(value => value + 1)}><Text style={styles.error}>{error} Tap to retry.</Text></Pressable>}
    {!photos.length && !error && <Text style={styles.note}>Take or choose a photo during check-in to add it here.</Text>}
    <View style={styles.grid}>{photos.map((photo, index) => <View key={`${photo.adventureId}:${photo.stopId}`} style={[styles.card, { transform: [{ rotate: index % 2 ? '1deg' : '-1deg' }] }]}>
      <Image source={{ uri: photo.uri }} style={styles.photo} accessibilityLabel={`Photo memory at ${photo.title}`} />
      <View style={styles.badge}><Text style={styles.badgeText}>MOMENT {String(index + 1).padStart(2, '0')}</Text></View>
      <Text style={styles.caption}>{photo.title}</Text>
      <Text style={styles.date}>{new Date(photo.createdAt).toLocaleDateString()}</Text>
    </View>)}</View>
  </View>;
}

const styles = StyleSheet.create({
  section: { marginTop: 28, paddingTop: 22, borderTopWidth: 1, borderColor: '#D5DEDA' },
  kicker: { color: '#D96149', fontSize: 10, letterSpacing: 1.5, fontWeight: '800' },
  heading: { color: '#173E39', fontSize: 15, fontWeight: '600', marginTop: 8 },
  note: { color: '#6B817B', fontSize: 11, lineHeight: 17, marginTop: 8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 20 },
  card: { width: '47%', maxWidth: '47%', backgroundColor: '#FFFFFF', padding: 8, borderWidth: 1, borderColor: '#D5DEDA', shadowColor: '#D1FF4A', shadowOffset: { width: 4, height: 5 }, shadowOpacity: 0.4, shadowRadius: 0, marginBottom: 8 },
  photo: { width: '100%', aspectRatio: 1.8 },
  badge: { position: 'absolute', top: 12, left: 12, borderRadius: 8, padding: 5, backgroundColor: '#173E39' },
  badgeText: { color: '#FFFFFF', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  caption: { color: '#173E39', fontSize: 12, fontStyle: 'italic', marginTop: 9 },
  date: { color: '#6B817B', fontSize: 9, marginTop: 6, marginBottom: 4 },
  error: { color: '#A23528', fontSize: 12, paddingVertical: 14 },
});
