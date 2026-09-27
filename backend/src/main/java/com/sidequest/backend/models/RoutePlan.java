package com.sidequest.backend.models;

import java.util.List;

public record RoutePlan(
    String profile,
    int totalDistanceMeters,
    int totalTravelMinutes,
    List<Leg> legs
) {
    public record Leg(int distanceMeters, int travelMinutes) {}
}
