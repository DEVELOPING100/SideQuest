package com.sidequest.backend.services;

import com.sidequest.backend.models.PlaceOption;
import com.sidequest.backend.models.RoutePlan;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class RoutingService {

    private static final String DIRECTIONS_URL =
        "https://api.heigit.org/openrouteservice/v2/directions/{profile}";

    private static final Map<String, String> PROFILES = Map.of(
        "walk", "foot-walking",
        "walking", "foot-walking",
        "bike", "cycling-regular",
        "biking", "cycling-regular",
        "cycling", "cycling-regular",
        "car", "driving-car",
        "driving", "driving-car"
    );

    // Fallback speeds in metres per minute, used when OpenRouteService is unavailable
    private static final Map<String, Double> FALLBACK_SPEEDS = Map.of(
        "foot-walking", 83.3,     // ~5 km/h
        "cycling-regular", 250.0, // ~15 km/h
        "driving-car", 500.0      // ~30 km/h city driving
    );

    // Streets aren't straight lines, so stretch the straight-line distance a bit
    private static final double DETOUR_FACTOR = 1.3;

    private final RestClient restClient;
    private final String apiKey;

    public RoutingService(
        @Value("${sidequest.routing.api-key:}") String apiKey
    ) {
        this.restClient = RestClient.builder()
            .requestFactory(new SimpleClientHttpRequestFactory())
            .build();
        this.apiKey = apiKey;
    }

    public RoutePlan calculate(List<PlaceOption> stops, String travelMode) {
        if (stops.size() < 2) {
            throw new IllegalArgumentException("At least two stops are required for routing");
        }

        String profile = PROFILES.get(travelMode.toLowerCase());
        if (profile == null) {
            throw new IllegalArgumentException("Unsupported travel mode: " + travelMode);
        }

        if (apiKey == null || apiKey.isBlank()) {
            System.out.println("Routing: no DISTANCE_API_KEY configured, using straight-line estimate");
            return estimateRoute(stops, profile);
        }

        try {
            return callOpenRouteService(stops, profile);
        } catch (Exception e) {
            System.out.println("Routing: OpenRouteService failed (" + e.getMessage() + "), using straight-line estimate");
            return estimateRoute(stops, profile);
        }
    }

    private RoutePlan callOpenRouteService(List<PlaceOption> stops, String profile) {
        List<List<Double>> coordinates = stops.stream()
            .map(stop -> List.of(stop.lng(), stop.lat()))
            .toList();

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("coordinates", coordinates);
        requestBody.put("geometry", false);

        JsonNode response = restClient.post()
            .uri(DIRECTIONS_URL, profile)
            .header("Authorization", apiKey)
            .contentType(MediaType.APPLICATION_JSON)
            .body(requestBody)
            .retrieve()
            .body(JsonNode.class);

        JsonNode route = requireRoute(response);
        JsonNode segments = route.path("segments");
        if (!segments.isArray() || segments.size() != stops.size() - 1) {
            throw new IllegalStateException("Routing response did not contain every route segment");
        }

        List<RoutePlan.Leg> legs = new ArrayList<>();
        legs.add(new RoutePlan.Leg(0, 0));
        for (JsonNode segment : segments) {
            int distanceMeters = (int) Math.round(segment.path("distance").asDouble());
            int travelMinutes = (int) Math.ceil(segment.path("duration").asDouble() / 60.0);
            legs.add(new RoutePlan.Leg(distanceMeters, travelMinutes));
        }

        JsonNode summary = route.path("summary");
        int totalTravelMinutes = legs.stream().mapToInt(RoutePlan.Leg::travelMinutes).sum();
        return new RoutePlan(
            profile,
            (int) Math.round(summary.path("distance").asDouble()),
            totalTravelMinutes,
            List.copyOf(legs)
        );
    }

    private RoutePlan estimateRoute(List<PlaceOption> stops, String profile) {
        double speed = FALLBACK_SPEEDS.getOrDefault(profile, 83.3);

        List<RoutePlan.Leg> legs = new ArrayList<>();
        legs.add(new RoutePlan.Leg(0, 0));
        int totalDistance = 0;
        int totalMinutes = 0;

        for (int i = 1; i < stops.size(); i++) {
            PlaceOption from = stops.get(i - 1);
            PlaceOption to = stops.get(i);
            int meters = (int) Math.round(
                haversineMeters(from.lat(), from.lng(), to.lat(), to.lng()) * DETOUR_FACTOR
            );
            int minutes = Math.max(1, (int) Math.ceil(meters / speed));
            legs.add(new RoutePlan.Leg(meters, minutes));
            totalDistance += meters;
            totalMinutes += minutes;
        }

        return new RoutePlan(profile, totalDistance, totalMinutes, List.copyOf(legs));
    }

    private double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        double earthRadius = 6_371_000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
            + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private JsonNode requireRoute(JsonNode response) {
        if (response == null || !response.path("routes").isArray()
            || response.path("routes").isEmpty()) {
            throw new IllegalStateException("Routing service returned no route");
        }
        return response.path("routes").get(0);
    }
}
