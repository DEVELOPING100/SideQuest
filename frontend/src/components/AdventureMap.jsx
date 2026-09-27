import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Feather from '@expo/vector-icons/Feather';

export default function AdventureMap({ stops }) {
  const map = useRef(null);
  const coordinates = stops.map(stop => stop.coordinate);
  function showAllStops() {
    map.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 65, right: 55, bottom: 55, left: 55 }, animated: true,
    });
  }
  return <View style={styles.container}>
    <MapView ref={map} style={styles.map}
      initialRegion={{ latitude: 45.9603, longitude: -66.6375, latitudeDelta: 0.008, longitudeDelta: 0.012 }}
      onMapReady={showAllStops} loadingEnabled rotateEnabled={false} pitchEnabled={false}
      showsUserLocation={false} showsMyLocationButton={false} toolbarEnabled={false}
      accessibilityLabel="Map of three sample stops in downtown Fredericton">
      {stops.map((stop, index) => <Marker key={stop.id} coordinate={stop.coordinate}
        title={`${index + 1}. ${stop.name}`} description="Sample adventure stop" anchor={{ x: 0.5, y: 0.5 }}>
        <View style={[styles.marker, index === 1 && styles.coral]}><Text style={styles.number}>{index + 1}</Text></View>
      </Marker>)}
    </MapView>
    <View pointerEvents="none" style={styles.badge}><Text style={styles.badgeText}>FREDERICTON · SAMPLE STOPS</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Show all three stops on the map" onPress={showAllStops}
      style={({ pressed }) => [styles.recenter, pressed && { opacity: 0.7 }]}>
      <Feather name="maximize" size={20} color="#173E39" />
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({
  container: { height: 300, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#173E39', backgroundColor: '#F3F0E7' },
  map: { ...StyleSheet.absoluteFillObject },
  badge: { position: 'absolute', top: 12, left: 20, backgroundColor: '#FFFEFA', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 7 },
  badgeText: { fontSize: 9, letterSpacing: 1, color: '#173E39', fontWeight: '600' },
  marker: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#173E39', borderWidth: 3, borderColor: '#FFFEFA', alignItems: 'center', justifyContent: 'center' },
  coral: { backgroundColor: '#FF765B' }, number: { color: '#FFFEFA', fontSize: 14, fontWeight: '700' },
  recenter: { position: 'absolute', top: 45, right: 14, width: 44, height: 44, backgroundColor: '#FFFEFA', borderWidth: 1.5, borderColor: '#173E39', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
