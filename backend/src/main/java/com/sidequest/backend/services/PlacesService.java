package com.sidequest.backend.services;

import org.springframework.stereotype.Service;
import java.util.*;

@Service
public class PlacesService {
    public List<Map<String, Object>> getNearbyPlaces(double lat, double lng, double budget, int timeMinutes, int groupSize) {
        List<Map<String, Object>> places = new ArrayList<>();
        places.add(new LinkedHashMap<>(Map.of(
            "placeId", "p1", "name", "Riverfront Trail", "category", "nature",
            "description", "A flat, scenic walking path along the river, good for a relaxed pace.",
            "estimatedMinutes", 30, "estimatedCost", 0, "lat", 45.9640, "lng", -66.6440
        )));
        places.add(new LinkedHashMap<>(Map.of(
            "placeId", "p2", "name", "Local Cafe", "category", "food",
            "description", "Small independent cafe known for its cold brew and quiet upstairs seating.",
            "estimatedMinutes", 30, "estimatedCost", 8, "lat", 45.9650, "lng", -66.6420
        )));
        places.add(new LinkedHashMap<>(Map.of(
            "placeId", "p3", "name", "Hidden Mural Wall", "category", "art",
            "description", "A large street-art mural tucked behind a downtown parking lot.",
            "estimatedMinutes", 20, "estimatedCost", 0, "lat", 45.9655, "lng", -66.6410
        )));
        return places;
    }
}
