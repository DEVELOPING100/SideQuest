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
    public List<String> pickPlaces(List<PlaceOption> places, BigDecimal budget, Integer timeMinutes, Integer groupSize) {
        List<String> fallback = places.stream().map(PlaceOption::placeId).toList();
        if (apiKey == null || apiKey.isBlank()) {
            System.out.println("No OpenAI key configured, using fallback");
            return fallback;
        }
        try {
            StringBuilder list = new StringBuilder();
            for (PlaceOption p : places) {
                list.append("- id=").append(p.placeId())
                    .append(", name=").append(p.name())
                    .append(", category=").append(p.category())
                    .append(", minutes=").append(p.estimatedMinutes())
                    .append(", cost=$").append(p.estimatedCost())
                    .append(", about=").append(p.description())
                    .append("\n");
            }

            String systemPrompt = "You are a local adventure planner. Pick 2 to 4 places from the list that fit the user's budget, time and group size, and order them logically. Total minutes must not exceed the time available and total cost must not exceed the budget. Respond ONLY with JSON: {\"orderedPlaceIds\": [\"p1\", \"p2\"]}";
            String userPrompt = "Places:\n" + list
                + "\nBudget: " + (budget == null ? "no limit" : "$" + budget)
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

            Set<String> known = new HashSet<>(fallback);
            List<String> picked = new ArrayList<>();
            for (Object id : (List<Object>) plan.getOrDefault("orderedPlaceIds", List.of())) {
                String s = String.valueOf(id);
                if (known.contains(s) && !picked.contains(s)) picked.add(s);
            }
            return picked.size() >= 2 ? picked : fallback;

        } catch (Exception e) {
            System.out.println("OpenAI call failed, using fallback: " + e.getMessage());
            return fallback;
        }
    }
}
