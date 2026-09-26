package com.sidequest.backend.controllers;

import com.sidequest.backend.models.PlaceOption;
import com.sidequest.backend.services.PlaceCatalogService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/places")
public class PlacesController {

    private final PlaceCatalogService placeCatalogService;

    public PlacesController(PlaceCatalogService placeCatalogService) {
        this.placeCatalogService = placeCatalogService;
    }

    @GetMapping("/nearby")
    public Map<String, Object> getNearbyPlaces(
        @RequestParam double lat,
        @RequestParam double lng,
        @RequestParam double budget,
        @RequestParam int timeMinutes,
        @RequestParam(required = false, defaultValue = "1") int groupSize
    ) {
        List<PlaceOption> places = placeCatalogService.nearbyPlaces();
        return Map.of("places", places);
    }
}
