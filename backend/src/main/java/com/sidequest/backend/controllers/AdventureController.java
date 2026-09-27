package com.sidequest.backend.controllers;

import com.sidequest.backend.services.OpenAiService;
import com.sidequest.backend.services.PlacesService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/adventures")
public class AdventureController {

    private final PlacesService placesService;
    private final OpenAiService openAiService;

    public AdventureController(PlacesService placesService, OpenAiService openAiService) {
        this.placesService = placesService;
        this.openAiService = openAiService;
    }

    @SuppressWarnings("unchecked")
    @PostMapping("/generate")
    public Map<String, Object> generateAdventure(@RequestBody Map<String, Object> request) {
        String mode = (String) request.getOrDefault("mode", "manual");
        Map<String, Object> location = (Map<String, Object>) request.get("location");
        double lat = ((Number) location.get("lat")).doubleValue();
        double lng = ((Number) location.get("lng")).doubleValue();
        double budget = ((Number) request.getOrDefault("budget", 0)).doubleValue();
        int timeMinutes = ((Number) request.getOrDefault("timeMinutes", 60)).intValue();
        int groupSize = ((Number) request.getOrDefault("groupSize", 1)).intValue();

        List<Map<String, Object>> allPlaces = placesService.getNearbyPlaces(lat, lng, budget, timeMinutes, groupSize);

        List<String> orderedIds;
        String title;

        if ("ai".equals(mode)) {
            Map<String, Object> plan = openAiService.generatePlan(allPlaces, budget, timeMinutes, groupSize);
            title = (String) plan.get("title");
            orderedIds = (List<String>) plan.get("orderedPlaceIds");
        } else {
            title = "Your Custom Adventure";
            orderedIds = (List<String>) request.getOrDefault("selectedPlaceIds", new ArrayList<>());
        }

        Map<String, Map<String, Object>> placesById = new HashMap<>();
        for (Map<String, Object> p : allPlaces) placesById.put((String) p.get("placeId"), p);

        List<Map<String, Object>> stops = new ArrayList<>();
        int order = 1;
        int totalMinutes = 0;
        for (String placeId : orderedIds) {
            Map<String, Object> place = placesById.get(placeId);
            if (place == null) continue;
            Map<String, Object> stop = new LinkedHashMap<>();
            stop.put("stopId", "s" + order);
            stop.put("name", place.get("name"));
            stop.put("category", place.get("category"));
            stop.put("description", place.get("description"));
            stop.put("estimatedMinutes", place.get("estimatedMinutes"));
            stop.put("lat", place.get("lat"));
            stop.put("lng", place.get("lng"));
            stop.put("order", order);
            totalMinutes += ((Number) place.get("estimatedMinutes")).intValue();
            stops.add(stop);
            order++;
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("adventureId", "adv_" + System.currentTimeMillis());
        result.put("title", title);
        result.put("mode", mode);
        result.put("totalEstimatedMinutes", totalMinutes);
        result.put("stops", stops);
        return result;
    }
}
