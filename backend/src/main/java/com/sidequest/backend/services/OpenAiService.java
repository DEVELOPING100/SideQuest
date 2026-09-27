package com.sidequest.backend.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.json.JsonParser;
import org.springframework.boot.json.JsonParserFactory;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import java.util.*;

@Service
public class OpenAiService {

    @Value("${openai.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private final JsonParser parser = JsonParserFactory.getJsonParser();

    public OpenAiService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @SuppressWarnings("unchecked")
    public Map<String, Object> generatePlan(List<Map<String, Object>> places, double budget, int timeMinutes, int groupSize) {
        try {
            StringBuilder placeList = new StringBuilder();
            for (Map<String, Object> p : places) {
                placeList.append("- id=").append(p.get("placeId"))
                    .append(", name=").append(p.get("name"))
                    .append(", category=").append(p.get("category"))
                    .append(", minutes=").append(p.get("estimatedMinutes"))
                    .append(", cost=$").append(p.get("estimatedCost"))
                    .append(", about=").append(p.get("description"))
                    .append("\n");
            }

            String systemPrompt = "You are a local adventure planner. Pick 2 to 4 places from the list that fit the user's budget, time and group size, and order them logically. Total minutes must not exceed the time available and total cost must not exceed the budget. Respond ONLY with JSON: {\"title\": \"short fun adventure title\", \"orderedPlaceIds\": [\"p1\", \"p2\"]}";
            String userPrompt = "Places:\n" + placeList + "\nBudget: $" + budget + "\nTime available: " + timeMinutes + " minutes\nGroup size: " + groupSize;

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

            String title = (String) plan.getOrDefault("title", "Your Generated Adventure");
            List<String> orderedIds = new ArrayList<>();
            for (Object id : (List<Object>) plan.getOrDefault("orderedPlaceIds", List.of())) {
                orderedIds.add(String.valueOf(id));
            }
            return Map.of("title", title, "orderedPlaceIds", orderedIds);

        } catch (Exception e) {
            System.out.println("OpenAI call failed, using fallback: " + e.getMessage());
            List<String> fallbackIds = new ArrayList<>();
            for (Map<String, Object> p : places) fallbackIds.add((String) p.get("placeId"));
            return Map.of("title", "A Local Adventure", "orderedPlaceIds", fallbackIds);
        }
    }
}

