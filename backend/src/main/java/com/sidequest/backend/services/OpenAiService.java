package com.sidequest.backend.services;

import com.sidequest.backend.models.PlaceOption;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.math.BigDecimal;
import java.util.*;

@Service
public class OpenAiService {

    @Value("${openai.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();
    private final JsonParser parser = JsonParserFactory.getJsonParser();

    @SuppressWarnings("unchecked")
    public List<String> pickPlaces(List<PlaceOption> places, BigDecimal budget, Integer timeMinutes,
                                   Integer groupSize, List<String> vibes, String travelMode) {
        List<String> fallback = fallbackPick(places, vibes);
        if (apiKey == null || apiKey.isBlank()) {
            System.out.println("No OpenAI key configured, using vibe-based fallback");
            return fallback;
        }
        try {
            StringBuilder list = new StringBuilder();
            for (PlaceOption p : places) {
                list.append("- id=").append(p.placeId())
                    .append(", name=").append(p.name())
                    .append(", category=").append(p.category())
                    .append(", minutes=").append(p.estimatedMinutes())
                    .append(", costPerPerson=$").append(p.estimatedCost())
                    .append(", lat=").append(p.lat())
                    .append(", lng=").append(p.lng())
                    .append(", about=").append(p.description())
                    .append("\n");
            }

            String vibeText = (vibes == null || vibes.isEmpty()) ? "any" : String.join(", ", vibes);

            String systemPrompt = "You are a local adventure planner for Fredericton, New Brunswick. "
                + "Pick 2 to 4 places from the list and order them into a route. Rules: "
                + "1) Match the user's vibes. Romance = scenic, quiet or intimate spots such as riverside parks, gardens, cafes and galleries. "
                + "Relax / chill = calm parks, cafes and easy strolls. Foodie = cafes and food stops. "
                + "Outdoors = parks, trails and nature. Art & culture = galleries and museums. "
                + "Surprise me = a varied, fun mix including activities. If several vibes are given, blend them. "
                + "2) Visit minutes plus travel time between stops must fit within the time available, and should use most of it (aim for 70 to 100 percent). "
                + "3) Cost is per person: the sum of costPerPerson times group size must not exceed the budget. "
                + "4) For walking keep stops close together; for biking or driving they can be further apart. "
                + "5) Order the stops so the route makes geographic sense. "
                + "Respond ONLY with JSON: {\"orderedPlaceIds\": [\"p1\", \"p2\"]}";

            String userPrompt = "Places:\n" + list
                + "\nVibes: " + vibeText
                + "\nTravel mode: " + (travelMode == null ? "walking" : travelMode)
                + "\nBudget for the whole group: " + (budget == null ? "no limit" : "$" + budget)
                + "\nTime available: " + timeMinutes + " minutes"
                + "\nGroup size: " + groupSize;

            Map<String, Object> body = new HashMap<>();
            body.put("model", "gpt-4o-mini");
            body.put("response_format", Map.of("type", "json_object"));
            body.put("messages", List.of(
                Map.of("role", "system", "content", systemPrompt),
                Map.of("role", "user", "content", userPrompt)
            ));

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            ResponseEntity<String> response = restTemplate.postForEntity(
                "https://api.openai.com/v1/chat/completions",
                new HttpEntity<>(body, headers),
                String.class
            );

            Map<String, Object> root = parser.parseMap(response.getBody());
            List<Object> choices = (List<Object>) root.get("choices");
            Map<String, Object> message = (Map<String, Object>) ((Map<String, Object>) choices.get(0)).get("message");
            Map<String, Object> plan = parser.parseMap((String) message.get("content"));

            Set<String> known = new HashSet<>();
            for (PlaceOption p : places) known.add(p.placeId());
            List<String> picked = new ArrayList<>();
            for (Object id : (List<Object>) plan.getOrDefault("orderedPlaceIds", List.of())) {
                String s = String.valueOf(id);
                if (known.contains(s) && !picked.contains(s)) picked.add(s);
            }
            return picked.size() >= 2 ? picked : fallback;

        } catch (Exception e) {
            System.out.println("OpenAI call failed, using vibe-based fallback: " + e.getMessage());
            return fallback;
        }
    }

    // Used when the AI is unavailable: pick up to 3 places whose category matches the vibes
    private List<String> fallbackPick(List<PlaceOption> places, List<String> vibes) {
        Set<String> wanted = new HashSet<>();
        if (vibes != null) {
            for (String v : vibes) {
                String s = v.toLowerCase();
                if (s.contains("romance")) wanted.addAll(List.of("park", "art", "food"));
                if (s.contains("relax") || s.contains("chill")) wanted.addAll(List.of("park", "food", "nature"));
                if (s.contains("food")) wanted.add("food");
                if (s.contains("outdoor")) wanted.addAll(List.of("park", "nature"));
                if (s.contains("art") || s.contains("culture")) wanted.addAll(List.of("art", "culture"));
                if (s.contains("surprise")) wanted.addAll(List.of("activity", "food", "art", "park"));
            }
        }
        List<String> picked = places.stream()
            .filter(p -> wanted.isEmpty() || wanted.contains(p.category()))
            .map(PlaceOption::placeId)
            .limit(3)
            .toList();
        if (picked.size() >= 2) return picked;
        return places.stream().map(PlaceOption::placeId).limit(3).toList();
    }
}

