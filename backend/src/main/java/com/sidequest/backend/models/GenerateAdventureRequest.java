package com.sidequest.backend.models;

import java.math.BigDecimal;
import java.util.List;

public record GenerateAdventureRequest(
    String mode,
    Location location,
    BigDecimal budget,
    Integer timeMinutes,
    Integer groupSize,
    List<String> selectedPlaceIds,
    List<String> vibes,
    String travelMode
) {
    public record Location(double lat, double lng) {}
}
