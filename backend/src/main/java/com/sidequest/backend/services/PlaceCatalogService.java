package com.sidequest.backend.services;

import com.sidequest.backend.models.PlaceOption;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PlaceCatalogService {

    private static final List<PlaceOption> DEMO_PLACES = List.of(
        new PlaceOption(
            "p1",
            "Riverfront Trail",
            "nature",
            "A flat, scenic walking path along the river, good for a relaxed pace.",
            30,
            0,
            45.9640,
            -66.6440
        ),
        new PlaceOption(
            "p2",
            "Local Cafe",
            "food",
            "Small independent cafe known for its cold brew and quiet upstairs seating.",
            30,
            8,
            45.9650,
            -66.6420
        ),
        new PlaceOption(
            "p3",
            "Hidden Mural Wall",
            "art",
            "A large street-art mural tucked behind a downtown parking lot.",
            20,
            0,
            45.9655,
            -66.6410
        )
    );

    public List<PlaceOption> nearbyPlaces() {
        return DEMO_PLACES;
    }

    public String descriptionFor(String placeId) {
        return DEMO_PLACES.stream()
            .filter(place -> place.placeId().equals(placeId))
            .map(PlaceOption::description)
            .findFirst()
            .orElse("");
    }

    public List<PlaceOption> selectPlaces(List<String> selectedPlaceIds) {
        if (selectedPlaceIds == null || selectedPlaceIds.isEmpty()) {
            return DEMO_PLACES.subList(0, 2);
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
        return DEMO_PLACES.stream()
            .filter(place -> place.placeId().equals(placeId))
            .findFirst()
            .orElseThrow(() -> new IllegalArgumentException("Unknown placeId: " + placeId));
    }
}
