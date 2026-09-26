package com.sidequest.backend.models;

import java.util.List;
import java.util.UUID;

public record AdventureResponse(
    UUID adventureId,
    String title,
    String mode,
    int totalEstimatedMinutes,
    List<Stop> stops
) {
    public record Stop(
        UUID stopId,
        String name,
        String category,
        String description,
        int estimatedMinutes,
        double lat,
        double lng,
        int order
    ) {}
}
