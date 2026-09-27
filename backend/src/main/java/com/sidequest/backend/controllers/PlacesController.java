package com.sidequest.backend.controllers;

import com.sidequest.backend.services.PlacesService;
import org.springframework.web.bind.annotation.*;
import java.util.*;

@RestController
@RequestMapping("/api/places")
public class PlacesController {

    private final PlacesService placesService;

    public PlacesController(PlacesService placesService) {
        this.placesService = placesService;
    }

    @GetMapping("/nearby")
    public Map<String, Object> getNearbyPlaces(
        @RequestParam double lat,
        @RequestParam double lng,
        @RequestParam double budget,
        @RequestParam int timeMinutes,
        @RequestParam(required = false, defaultValue = "1") int groupSize
    ) {
        return Map.of("places", placesService.getNearbyPlaces(lat, lng, budget, timeMinutes, groupSize));
    }
}
