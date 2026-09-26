package com.sidequest.backend.controllers;

import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/adventures")
public class AdventureController {

    @PostMapping("/generate")
    public Map<String, Object> generateAdventure(@RequestBody Map<String, Object> request) {
        String mode = (String) request.getOrDefault("mode", "manual");

        List<Map<String, Object>> stops = new ArrayList<>();
        stops.add(Map.of(
            "stopId", "s1", "name", "Riverfront Trail", "category", "nature",
            "description", "A flat, scenic walking path along the river, good for a relaxed pace.",
            "estimatedMinutes", 30, "lat", 45.9640, "lng", -66.6440, "order", 1
        ));
        stops.add(Map.of(
            "stopId", "s2", "name", "Local Cafe", "category", "food",
            "description", "Small independent cafe known for its cold brew and quiet upstairs seating.",
            "estimatedMinutes", 30, "lat", 45.9650, "lng", -66.6420, "order", 2
        ));

        return Map.of(
            "adventureId", "adv_123",
            "title", "A Chill Riverside Afternoon",
            "mode", mode,
            "totalEstimatedMinutes", 60,
            "stops", stops
        );
    }
}
