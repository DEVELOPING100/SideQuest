package com.sidequest.backend.models;

public record PlaceOption(
    String placeId,
    String name,
    String category,
    String description,
    int estimatedMinutes,
    double estimatedCost,
    double lat,
    double lng
) {}
