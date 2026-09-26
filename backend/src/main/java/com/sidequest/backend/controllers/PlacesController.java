package com.sidequest.backend.controllers;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/places")
public class PlacesController {

    @GetMapping("/nearby")
    public Map<String, Object> getNearbyPlaces(
        @RequestParam double lat,
        @RequestParam double lng,
        @RequestParam double budget,
        @RequestParam int timeMinutes,
        @RequestParam(required = false, defaultValue = "1") int groupSize
    ) {
        List<Map<String, Object>> places = new ArrayList<>();
        places.add(Map.of(
            "placeId", "p1", "name", "Riverfront Trail", "category", "nature",
            "description", "A flat, scenic walking path along the river, good for a relaxed pace.",
            "estimatedMinutes", 30, "estimatedCost", 0, "lat", 45.9640, "lng", -66.6440
        ));
        places.add(Map.of(
            "placeId", "p2", "name", "Local Cafe", "category", "food",
            "description", "Small independent cafe known for its cold brew and quiet upstairs seating.",
            "estimatedMinutes", 30, "estimatedCost", 8, "lat", 45.9650, "lng", -66.6420
        ));
        return Map.of("places", places);
    }
}
