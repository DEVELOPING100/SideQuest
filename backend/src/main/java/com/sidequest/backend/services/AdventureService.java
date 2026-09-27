package com.sidequest.backend.services;

import com.sidequest.backend.models.AdventureResponse;
import com.sidequest.backend.models.GenerateAdventureRequest;
import com.sidequest.backend.models.PlaceOption;
import com.sidequest.backend.models.RoutePlan;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class AdventureService {

    private final PlaceCatalogService placeCatalogService;
    private final RoutingService routingService;
    private final SupabaseAdventureService supabaseAdventureService;
    private final OpenAiService openAiService;

    public AdventureService(
        PlaceCatalogService placeCatalogService,
        RoutingService routingService,
        SupabaseAdventureService supabaseAdventureService,
        OpenAiService openAiService
    ) {
        this.placeCatalogService = placeCatalogService;
        this.routingService = routingService;
        this.supabaseAdventureService = supabaseAdventureService;
        this.openAiService = openAiService;
    }

    public AdventureResponse generate(GenerateAdventureRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Request body is required");
        }

        validate(request);

        String mode = request.mode() == null ? "manual" : request.mode();
        String travel = routingMode(request.travelMode());
        List<String> placeIds = request.selectedPlaceIds();

        if (mode.equals("ai")) {
            placeIds = openAiService.pickPlaces(
                placeCatalogService.nearbyPlaces(request.location().lat(), request.location().lng()),
                request.budget(),
                request.timeMinutes(),
                request.groupSize(),
                request.vibes(),
                travel
            );
        }

        List<PlaceOption> places = new ArrayList<>(placeCatalogService.selectPlaces(placeIds));
        RoutePlan routePlan = routingService.calculate(places, travel);

        // AI mode: drop stops from the end until the quest fits the user's time (keep at least 2)
        if (mode.equals("ai")) {
            while (places.size() > 2 && totalMinutes(places, routePlan) > request.timeMinutes()) {
                places = new ArrayList<>(places.subList(0, places.size() - 1));
                routePlan = routingService.calculate(places, travel);
            }
        }

        return supabaseAdventureService.save(request, places, routePlan);
    }

    // Map the app's "Walk" / "Bike" / "Drive" to a routing mode
    private String routingMode(String travelMode) {
        if (travelMode == null) return "walking";
        String t = travelMode.toLowerCase();
        if (t.startsWith("bike") || t.startsWith("cycl")) return "biking";
        if (t.startsWith("drive") || t.startsWith("car")) return "driving";
        return "walking";
    }

    private int totalMinutes(List<PlaceOption> places, RoutePlan routePlan) {
        return places.stream().mapToInt(PlaceOption::estimatedMinutes).sum() + routePlan.totalTravelMinutes();
    }

    private void validate(GenerateAdventureRequest request) {
        String mode = request.mode() == null ? "manual" : request.mode();
        if (!mode.equals("manual") && !mode.equals("ai")) {
            throw new IllegalArgumentException("mode must be 'manual' or 'ai'");
        }
        if (request.location() == null) {
            throw new IllegalArgumentException("location is required");
        }
        if (request.location().lat() < -90 || request.location().lat() > 90
            || request.location().lng() < -180 || request.location().lng() > 180) {
            throw new IllegalArgumentException("location coordinates are invalid");
        }
        if (request.budget() != null && request.budget().signum() < 0) {
            throw new IllegalArgumentException("budget cannot be negative");
        }
        if (request.timeMinutes() == null || request.timeMinutes() <= 0) {
            throw new IllegalArgumentException("timeMinutes must be positive");
        }
        if (request.groupSize() == null || request.groupSize() <= 0) {
            throw new IllegalArgumentException("groupSize must be positive");
        }
    }
}
