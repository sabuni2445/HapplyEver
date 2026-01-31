package com.elegantevents.service;

import com.elegantevents.dto.AIImageResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AIService {

    @Value("${openai.api.key:}")
    private String apiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    public AIImageResponse generateImage(String prompt) {
        // More robust key check: must exist, not be empty, and look like an OpenAI key (typically sk-...)
        boolean hasValidKey = apiKey != null && !apiKey.trim().isEmpty() && 
                             (apiKey.startsWith("sk-") || apiKey.length() > 20) &&
                             !apiKey.contains("${OPENAI_API_KEY");

        if (!hasValidKey) {
            String debugKey = (apiKey == null) ? "NULL" : 
                             (apiKey.isEmpty() ? "EMPTY" : 
                             (apiKey.length() > 10 ? apiKey.substring(0, 7) + "..." : "TOO_SHORT: " + apiKey));
            
            System.out.println("[AI Service] Falling back to mock images. Key Status: " + debugKey);
            String lowerPrompt = prompt.toLowerCase();
            
            if (lowerPrompt.contains("tradition") || lowerPrompt.contains("ethiopia") || lowerPrompt.contains("habesha")) {
                return new AIImageResponse("https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000"); // Ethiopian/Trad
            } else if (lowerPrompt.contains("islamic") || lowerPrompt.contains("muslim") || lowerPrompt.contains("crescent")) {
                return new AIImageResponse("https://images.unsplash.com/photo-1584974232726-67ff93839172?q=80&w=1000"); // Islamic
            } else if (lowerPrompt.contains("christian") || lowerPrompt.contains("church") || lowerPrompt.contains("cross")) {
                return new AIImageResponse("https://images.unsplash.com/photo-1523438885200-e635ba2c371e?q=80&w=1000"); // Christian
            } else if (lowerPrompt.contains("flower") || lowerPrompt.contains("floral") || lowerPrompt.contains("romantic")) {
                return new AIImageResponse("https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000"); // Floral
            } else if (lowerPrompt.contains("gold") || lowerPrompt.contains("luxury") || lowerPrompt.contains("royal")) {
                return new AIImageResponse("https://images.unsplash.com/photo-1549416843-70732df894c2?q=80&w=1000"); // Gold/Luxury
            }
            
            // Random fallback for variety
            return new AIImageResponse("https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000");
        }

        try {
            String url = "https://api.openai.com/v1/images/generations";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("prompt", prompt);
            requestBody.put("n", 1);
            requestBody.put("size", "1024x1024");

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            
            Map<String, Object> response = restTemplate.postForObject(url, entity, Map.class);
            
            if (response != null && response.containsKey("data")) {
                List<Map<String, Object>> data = (List<Map<String, Object>>) response.get("data");
                if (!data.isEmpty()) {
                    String imageUrl = (String) data.get(0).get("url");
                    return new AIImageResponse(imageUrl);
                }
            }
            
            throw new RuntimeException("Empty response from OpenAI");
            
        } catch (Exception e) {
            System.err.println("Error calling OpenAI: " + e.getMessage());
            // Fallback to mock on error
            return new AIImageResponse("https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000&auto=format&fit=crop");
        }
    }
}
