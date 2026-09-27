package com.sidequest.backend.services;

import com.sidequest.backend.models.AdventureDetailsResponse;
import com.sidequest.backend.models.AdventureResponse;
import com.sidequest.backend.models.CheckInRequest;
import com.sidequest.backend.models.CheckInResponse;
import com.sidequest.backend.models.GenerateAdventureRequest;
import com.sidequest.backend.models.PassportResponse;
import com.sidequest.backend.models.PlaceOption;
import com.sidequest.backend.models.RoutePlan;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.net.URI;
import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import tools.jackson.databind.JsonNode;

@Service
public class SupabaseAdventureService {

    private static final UUID DEMO_USER_ID =
        UUID.fromString("11111111-1111-4111-8111-111111111111");

    private final RestClient restClient;
    private final String supabaseUrl;
    private final String secretKey;
    private final PlaceCatalogService placeCatalogService;

    public SupabaseAdventureService(
        @Value("${sidequest.supabase.url:}") String supabaseUrl,
        @Value("${sidequest.supabase.secret-key:}") String secretKey,
        PlaceCatalogService placeCatalogService
    ) {
        this.restClient = RestClient.create();
        this.supabaseUrl = stripTrailingSlash(supabaseUrl);
        this.secretKey = secretKey;
        this.placeCatalogService = placeCatalogService;
    }

    public AdventureResponse save(
        GenerateAdventureRequest request,
        List<PlaceOption> places,
        RoutePlan routePlan
    ) {
        requireConfigured();

        UUID adventureId = UUID.randomUUID();
        List<UUID> stopIds = places.stream().map(ignored -> UUID.randomUUID()).toList();
        int activityMinutes = places.stream().mapToInt(PlaceOption::estimatedMinutes).sum();
        int totalMinutes = activityMinutes + routePlan.totalTravelMinutes();

        String title = buildTitle(places); insertAdventure(title, adventureId, request, places, totalMinutes);
        try {
            insertStops(adventureId, stopIds, places, routePlan);
        } catch (RuntimeException error) {
            deleteAdventure(adventureId);
            throw error;
        }

        List<AdventureResponse.Stop> responseStops = new ArrayList<>();
        for (int index = 0; index < places.size(); index++) {
            PlaceOption place = places.get(index);
            responseStops.add(new AdventureResponse.Stop(
                stopIds.get(index),
                place.name(),
                place.category(),
                place.description(),
                place.estimatedMinutes(),
                place.lat(),
                place.lng(),
                index + 1
            ));
        }

        return new AdventureResponse(
            adventureId,
            title,
            normalizedMode(request.mode()),
            totalMinutes,
            List.copyOf(responseStops)
        );
    }

    public AdventureDetailsResponse findAdventure(UUID adventureId) {
        requireConfigured();
        JsonNode adventures = get(
            "adventures?id=eq." + adventureId
                + "&select=id,title,total_estimated_minutes"
        );
        if (!adventures.isArray() || adventures.isEmpty()) {
            throw new IllegalArgumentException("Adventure not found: " + adventureId);
        }

        JsonNode adventure = adventures.get(0);
        JsonNode savedStops = get(
            "stops?adventure_id=eq." + adventureId
                + "&select=id,external_place_id,name,category,estimated_minutes,latitude,longitude,"
                + "stop_order,distance_from_previous_meters,travel_minutes_from_previous,completed"
                + "&order=stop_order.asc"
        );

        List<AdventureDetailsResponse.Stop> stops = new ArrayList<>();
        for (JsonNode stop : savedStops) {
            stops.add(new AdventureDetailsResponse.Stop(
                UUID.fromString(stop.path("id").asString()),
                stop.path("name").asString(),
                stop.path("category").asString(),
                placeCatalogService.descriptionFor(stop.path("external_place_id").asString()),
                stop.path("estimated_minutes").asInt(),
                stop.path("latitude").asDouble(),
                stop.path("longitude").asDouble(),
                stop.path("stop_order").asInt(),
                stop.path("distance_from_previous_meters").asInt(),
                stop.path("travel_minutes_from_previous").asInt(),
                stop.path("completed").asBoolean()
            ));
        }

        return new AdventureDetailsResponse(
            adventureId,
            adventure.path("title").asString(),
            "manual",
            adventure.path("total_estimated_minutes").asInt(),
            List.copyOf(stops)
        );
    }

    public CheckInResponse checkIn(UUID adventureId, CheckInRequest request) {
        requireConfigured();
        if (request == null || request.stopId() == null) {
            throw new IllegalArgumentException("stopId and location are required");
        }
        if (request.lat() < -90 || request.lat() > 90
            || request.lng() < -180 || request.lng() > 180) {
            throw new IllegalArgumentException("Check-in coordinates are invalid");
        }

        JsonNode savedStops = get(
            "stops?id=eq." + request.stopId()
                + "&adventure_id=eq." + adventureId
                + "&select=id,latitude,longitude"
        );
        if (!savedStops.isArray() || savedStops.isEmpty()) {
            throw new IllegalArgumentException("Stop does not belong to this adventure");
        }

        JsonNode savedStop = savedStops.get(0);
        double distanceMeters = distanceMeters(
            request.lat(),
            request.lng(),
            savedStop.path("latitude").asDouble(),
            savedStop.path("longitude").asDouble()
        );
        if (distanceMeters > 150) {
            throw new IllegalArgumentException(
                "You must be within 150 metres of the stop to check in"
            );
        }

        Instant completedAt = Instant.now();
        patch(
            "stops?id=eq." + request.stopId(),
            Map.of("completed", true, "completed_at", completedAt.toString())
        );
        completeAdventureIfReady(adventureId);

        return new CheckInResponse(true, request.stopId(), completedAt);
    }

    public PassportResponse getPassport() {
        requireConfigured();
        JsonNode savedStamps = get(
            "stamps?user_id=eq." + DEMO_USER_ID
                + "&select=id,adventure_id,title,earned_at,stop_count"
                + "&order=earned_at.desc"
        );

        List<PassportResponse.Stamp> stamps = new ArrayList<>();
        for (JsonNode stamp : savedStamps) {
            stamps.add(new PassportResponse.Stamp(
                UUID.fromString(stamp.path("id").asString()),
                UUID.fromString(stamp.path("adventure_id").asString()),
                stamp.path("title").asString(),
                "manual",
                stamp.path("earned_at").asString(),
                stamp.path("stop_count").asInt()
            ));
        }

        return new PassportResponse(DEMO_USER_ID, List.copyOf(stamps));
    }

    private void insertAdventure(String title,
        UUID adventureId,
        GenerateAdventureRequest request,
        List<PlaceOption> places,
        int totalMinutes
    ) {
        Map<String, Object> adventure = new LinkedHashMap<>();
        adventure.put("id", adventureId);
        adventure.put("user_id", DEMO_USER_ID);
        adventure.put("title", title);
        adventure.put("location_name", locationName(request.location()));
        adventure.put("budget", request.budget() == null ? BigDecimal.ZERO : request.budget());
        adventure.put("time_minutes", request.timeMinutes() == null ? totalMinutes : request.timeMinutes());
        adventure.put("group_size", request.groupSize() == null ? 1 : request.groupSize());
        adventure.put("travel_mode", "walking");
        adventure.put("interests", places.stream().map(PlaceOption::category).distinct().toList());
        adventure.put("total_estimated_minutes", totalMinutes);
        adventure.put("status", "planned");

        post("adventures", adventure);
    }

    private void insertStops(
        UUID adventureId,
        List<UUID> stopIds,
        List<PlaceOption> places,
        RoutePlan routePlan
    ) {
        List<Map<String, Object>> stops = new ArrayList<>();
        for (int index = 0; index < places.size(); index++) {
            PlaceOption place = places.get(index);
            RoutePlan.Leg leg = routePlan.legs().get(index);
            Map<String, Object> stop = new LinkedHashMap<>();
            stop.put("id", stopIds.get(index));
            stop.put("adventure_id", adventureId);
            stop.put("external_place_id", place.placeId());
            stop.put("name", place.name());
            stop.put("category", place.category());
            stop.put("estimated_minutes", place.estimatedMinutes());
            stop.put("latitude", place.lat());
            stop.put("longitude", place.lng());
            stop.put("stop_order", index + 1);
            stop.put("distance_from_previous_meters", leg.distanceMeters());
            stop.put("travel_minutes_from_previous", leg.travelMinutes());
            stops.add(stop);
        }

        post("stops", stops);
    }

    private void post(String table, Object body) {
        restClient.post()
            .uri(tableUri(table))
            .header("apikey", secretKey)
            .header("Prefer", "return=minimal")
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .toBodilessEntity();
    }

    private JsonNode get(String resourceAndQuery) {
        JsonNode response = restClient.get()
            .uri(URI.create(supabaseUrl + "/rest/v1/" + resourceAndQuery))
            .header("apikey", secretKey)
            .retrieve()
            .body(JsonNode.class);
        if (response == null) {
            throw new IllegalStateException("Supabase returned an empty response");
        }
        return response;
    }

    private void patch(String resourceAndQuery, Object body) {
        restClient.patch()
            .uri(URI.create(supabaseUrl + "/rest/v1/" + resourceAndQuery))
            .header("apikey", secretKey)
            .header("Prefer", "return=minimal")
            .contentType(MediaType.APPLICATION_JSON)
            .body(body)
            .retrieve()
            .toBodilessEntity();
    }

    private void completeAdventureIfReady(UUID adventureId) {
        JsonNode stops = get(
            "stops?adventure_id=eq." + adventureId + "&select=id,completed"
        );
        if (stops.isEmpty()) {
            return;
        }
        for (JsonNode stop : stops) {
            if (!stop.path("completed").asBoolean()) {
                return;
            }
        }

        Instant completedAt = Instant.now();
        patch(
            "adventures?id=eq." + adventureId,
            Map.of("status", "completed", "completed_at", completedAt.toString())
        );
        createStampIfMissing(adventureId, stops.size());
    }

    private void createStampIfMissing(UUID adventureId, int stopCount) {
        JsonNode existing = get(
            "stamps?adventure_id=eq." + adventureId + "&select=id&limit=1"
        );
        if (!existing.isEmpty()) {
            return;
        }

        JsonNode adventures = get(
            "adventures?id=eq." + adventureId + "&select=title&limit=1"
        );
        if (adventures.isEmpty()) {
            throw new IllegalStateException("Adventure disappeared before stamp creation");
        }

        post("stamps", Map.of(
            "id", UUID.randomUUID(),
            "user_id", DEMO_USER_ID,
            "adventure_id", adventureId,
            "title", adventures.get(0).path("title").asString(),
            "stop_count", stopCount
        ));
    }

    private double distanceMeters(
        double firstLat,
        double firstLng,
        double secondLat,
        double secondLng
    ) {
        double earthRadiusMeters = 6_371_000;
        double latDelta = Math.toRadians(secondLat - firstLat);
        double lngDelta = Math.toRadians(secondLng - firstLng);
        double firstLatRadians = Math.toRadians(firstLat);
        double secondLatRadians = Math.toRadians(secondLat);

        double haversine = Math.sin(latDelta / 2) * Math.sin(latDelta / 2)
            + Math.cos(firstLatRadians) * Math.cos(secondLatRadians)
            * Math.sin(lngDelta / 2) * Math.sin(lngDelta / 2);
        return earthRadiusMeters * 2 * Math.atan2(
            Math.sqrt(haversine),
            Math.sqrt(1 - haversine)
        );
    }

    private void deleteAdventure(UUID adventureId) {
        try {
            restClient.delete()
                .uri(URI.create(tableUri("adventures") + "?id=eq." + adventureId))
                .header("apikey", secretKey)
                .retrieve()
                .toBodilessEntity();
        } catch (RuntimeException ignored) {
            // Preserve the original insert error if best-effort cleanup also fails.
        }
    }

    private URI tableUri(String table) {
        return URI.create(supabaseUrl + "/rest/v1/" + table);
    }

    private String locationName(GenerateAdventureRequest.Location location) {
        if (location == null) {
            return "Fredericton, NB";
        }
        return "%.4f, %.4f".formatted(location.lat(), location.lng());
    }

    private String buildTitle(List<PlaceOption> places) {
        if (places == null || places.isEmpty()) {
            return "A Local Adventure";
        }
        String first = places.get(0).name();
        String last = places.get(places.size() - 1).name();
        if (places.size() == 2) {
            return first + " & " + last;
        }
        return first + " to " + last;
    }

    private String normalizedMode(String mode) {
        return mode == null || mode.isBlank() ? "manual" : mode;
    }

    private void requireConfigured() {
        if (supabaseUrl.isBlank()) {
            throw new IllegalStateException("SUPABASE_URL is not configured");
        }
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("SUPABASE_SECRET_KEY is not configured");
        }
    }

    private static String stripTrailingSlash(String value) {
        if (value == null) {
            return "";
        }
        return value.endsWith("/") ? value.substring(0, value.length() - 1) : value;
    }
}

