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
        requireConfigured();

        if (stops.size() < 2) {
            throw new IllegalArgumentException("At least two stops are required for routing");
        }

        String profile = PROFILES.get(travelMode.toLowerCase());
        if (profile == null) {
            throw new IllegalArgumentException("Unsupported travel mode: " + travelMode);
        }

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

    private JsonNode requireRoute(JsonNode response) {
        if (response == null || !response.path("routes").isArray()
            || response.path("routes").isEmpty()) {
            throw new IllegalStateException("Routing service returned no route");
        }
        return response.path("routes").get(0);
    }

    private void requireConfigured() {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("DISTANCE_API_KEY is not configured");
        }
    }
}
