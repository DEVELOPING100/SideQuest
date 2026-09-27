package com.sidequest.backend.services;

import com.sidequest.backend.models.PlaceOption;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

// Place names and coordinates sourced from OpenStreetMap (c) OpenStreetMap contributors.
// Fredericton places are hand-picked; other cities come from scripts/fetch-places.ps1.
// Descriptions, visit times and costs are estimates.
@Service
public class PlaceCatalogService {

    private static final List<PlaceOption> FREDERICTON = List.of(
        new PlaceOption("p1", "Officers' Square", "park", "Historic square in the downtown Garrison District, an easy starting point for a walk.", 20, 0, 45.9618651, -66.6389938),
        new PlaceOption("p2", "The Green", "park", "Riverside green space downtown, good for a relaxed stroll along the water.", 30, 0, 45.9590199, -66.6417949),
        new PlaceOption("p3", "Odell Park", "nature", "Large wooded park with walking trails, a quiet nature break from downtown.", 60, 0, 45.9530000, -66.6706094),
        new PlaceOption("p4", "Wilmot Park", "park", "Open neighbourhood park, good for a picnic or a group hangout.", 30, 0, 45.9635407, -66.6565911),
        new PlaceOption("p5", "Fredericton Botanical Gardens", "nature", "Gardens and trails on the west side of the city, best in spring and summer.", 45, 0, 45.9518443, -66.6796582),
        new PlaceOption("p6", "Queens Square", "park", "Small park south of downtown, a calm spot to sit for a bit.", 20, 0, 45.9533777, -66.6408086),
        new PlaceOption("p7", "Nomad Coffee", "food", "Downtown coffee shop, an easy stop to grab a drink between activities.", 25, 6, 45.9615156, -66.6400284),
        new PlaceOption("p8", "Jonnie Java Roasters", "food", "Downtown cafe and coffee roaster.", 25, 6, 45.9622735, -66.6439379),
        new PlaceOption("p9", "Molly's", "food", "Cafe right by Officers' Square, handy in the middle of a downtown walk.", 30, 8, 45.9614435, -66.6398530),
        new PlaceOption("p10", "Mimizawa", "food", "Downtown cafe for a snack or a drink.", 25, 8, 45.9611813, -66.6427021),
        new PlaceOption("p11", "Grain and Grind Co.", "food", "Cafe east of downtown, a good coffee stop on the way to Carleton Park.", 25, 8, 45.9589084, -66.6246189),
        new PlaceOption("p12", "The Lily Dipper Cafe", "food", "Cafe west of downtown, near Wilmot Park.", 25, 7, 45.9659386, -66.6518003),
        new PlaceOption("p13", "Unplugged Games Cafe", "activity", "Board game cafe, great for groups who want to sit down and play.", 60, 10, 45.9626920, -66.6427880),
        new PlaceOption("p14", "The Purrfect Cup Cat Cafe", "activity", "Cat cafe on the north side, spend time with cats over a drink.", 45, 12, 45.9822036, -66.6131894),
        new PlaceOption("p15", "Wolastoq Boat Tours", "activity", "Boat tour on the river, seasonal, book ahead.", 60, 35, 45.9621542, -66.6367773),
        new PlaceOption("p16", "Gallery 78", "art", "Art gallery showing local and regional artists.", 30, 0, 45.9586870, -66.6349701),
        new PlaceOption("p17", "Gallery on Queen", "art", "Downtown art gallery on Queen Street.", 25, 0, 45.9628007, -66.6430235),
        new PlaceOption("p18", "School Days Museum", "culture", "Small downtown museum about school life in the past.", 30, 0, 45.9632830, -66.6419017),
        new PlaceOption("p19", "Quartermain Earth Science Centre", "culture", "Rock, mineral and fossil displays on the UNB campus.", 30, 0, 45.9481625, -66.6423000)
    );

    private static final double NEARBY_KM = 10.0;

    private final List<PlaceOption> allPlaces;

    public PlaceCatalogService() {
        List<PlaceOption> places = new ArrayList<>(FREDERICTON);
        places.addAll(loadExtraPlaces());
        this.allPlaces = List.copyOf(places);
        System.out.println("Place catalog loaded: " + allPlaces.size() + " places");
    }

    @SuppressWarnings("unchecked")
    private static List<PlaceOption> loadExtraPlaces() {
        try (InputStream in = PlaceCatalogService.class.getResourceAsStream("/places-extra.json")) {
            if (in == null) {
                return List.of();
            }
            String text = new String(in.readAllBytes(), StandardCharsets.UTF_8);
            if (text.startsWith("\uFEFF")) {
                text = text.substring(1);
            }
            List<Object> raw = JsonParserFactory.getJsonParser().parseList(text);
            List<PlaceOption> out = new ArrayList<>();
            for (Object item : raw) {
                Map<String, Object> m = (Map<String, Object>) item;
                out.add(new PlaceOption(
                    (String) m.get("placeId"),
                    (String) m.get("name"),
                    (String) m.get("category"),
                    (String) m.get("description"),
                    ((Number) m.get("estimatedMinutes")).intValue(),
                    ((Number) m.get("estimatedCost")).doubleValue(),
                    ((Number) m.get("lat")).doubleValue(),
                    ((Number) m.get("lng")).doubleValue()
                ));
            }
            return out;
        } catch (Exception e) {
            System.out.println("Could not load extra places: " + e.getMessage());
            return List.of();
        }
    }

    // Kept for existing callers: the Fredericton list
    public List<PlaceOption> nearbyPlaces() {
        return FREDERICTON;
    }

    // Places within NEARBY_KM of the given location; falls back to Fredericton if none are close
    public List<PlaceOption> nearbyPlaces(double lat, double lng) {
        List<PlaceOption> near = allPlaces.stream()
            .filter(p -> distanceKm(lat, lng, p.lat(), p.lng()) <= NEARBY_KM)
            .toList();
        return near.size() >= 2 ? near : FREDERICTON;
    }

    public String descriptionFor(String placeId) {
        return allPlaces.stream()
            .filter(place -> place.placeId().equals(placeId))
            .map(PlaceOption::description)
            .findFirst()
            .orElse("");
    }

    public List<PlaceOption> selectPlaces(List<String> selectedPlaceIds) {
        if (selectedPlaceIds == null || selectedPlaceIds.isEmpty()) {
            return FREDERICTON.subList(0, 2);
        }

        List<PlaceOption> selected = selectedPlaceIds.stream()
            .map(this::findById)
            .toList();

        if (selected.size() < 2) {
            throw new IllegalArgumentException("Select at least two places for an adventure");
        }

        return selected;
    }

    private PlaceOption findById(String placeId) {
        return allPlaces.stream()
            .filter(place -> place.placeId().equals(placeId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unknown placeId: " + placeId));
    }

    private static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return 6371.0 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }
}