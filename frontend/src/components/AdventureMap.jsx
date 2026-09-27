import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import Feather from '@expo/vector-icons/Feather';

const MODES = { walk: 'walking', bike: 'bicycling', drive: 'driving' };

export default function AdventureMap({ stops = [], travel = 'Walk', city = 'Fredericton' }) {
  const map = useRef(null);
  const [hasPermission, setHasPermission] = useState(false);
  const coordinates = stops.map(stop => stop.coordinate);

  // Ask for location so the phone can show the blue "you are here" dot
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (active && status === 'granted') setHasPermission(true);
      } catch {
        // Location unavailable: the map still shows the stops
      }
    })();
    return () => { active = false; };
  }, []);

  function showAllStops() {
    if (coordinates.length === 0) return;
    map.current?.fitToCoordinates(coordinates, {
      edgePadding: { top: 60, right: 50, bottom: 60, left: 50 }, animated: true,
    });
  }

  // Full road route in Google Maps: from the phone's location, through every stop, in the chosen mode
  function openFullRoute() {
    if (stops.length === 0) return;
    const mode = MODES[String(travel).toLowerCase()] || 'walking';
    const last = stops[stops.length - 1];
    const middle = stops.slice(0, -1).map(s => `${s.lat},${s.lng}`).join('|');
    let url = `https://www.google.com/maps/dir/?api=1&destination=${last.lat},${last.lng}&travelmode=${mode}`;
    if (middle) url += `&waypoints=${encodeURIComponent(middle)}`;
    Linking.openURL(url).catch(() => {});
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={map}
        style={{ flex: 1 }}
        initialRegion={{ latitude: 45.9603, longitude: -66.6375, latitudeDelta: 0.02, longitudeDelta: 0.03 }}
        onMapReady={showAllStops}
        showsUserLocation={hasPermission}
      >
        {stops.map((stop, index) => (
          <Marker
            key={stop.id}
            coordinate={stop.coordinate}
            pinColor="red"
            title={`${index + 1}. ${stop.name}`}
            description={stop.detail}
          />
        ))}
      </MapView>
      <View pointerEvents="none" style={styles.badge}>
        <Text style={styles.badgeText}>{`${city.toUpperCase()} \u00b7 ${stops.length} STOPS`}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Show all stops on the map" onPress={showAllStops} style={styles.recenter}>
        <Feather name="maximize" size={20} color="#173E39" />
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Open the full route in Google Maps" onPress={openFullRoute} style={styles.routeButton}>
        <Feather name="navigation" size={16} color="#173E39" />
        <Text style={styles.routeText}>Route in Maps</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { height: 300, borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: '#173E39', backgroundColor: '#F3F0E7' },
  badge: { position: 'absolute', top: 12, left: 20, backgroundColor: '#FFFEFA', paddingHorizontal: 9, paddingVertical: 7, borderRadius: 7 },
  badgeText: { fontSize: 9, letterSpacing: 1, color: '#173E39', fontWeight: '600' },
  recenter: { position: 'absolute', top: 45, right: 14, width: 44, height: 44, backgroundColor: '#FFFEFA', borderWidth: 1.5, borderColor: '#173E39', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  routeButton: { position: 'absolute', bottom: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: '#D6F65B', borderWidth: 1.5, borderColor: '#173E39', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 10 },
  routeText: { fontSize: 13, fontWeight: '700', color: '#173E39' },
});