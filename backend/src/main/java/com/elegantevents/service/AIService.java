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
        if (apiKey == null || apiKey.isEmpty() || apiKey.equals("your-openai-api-key-here")) {
            // Return a high-quality wedding-themed mock image if no API key is provided
            // Different prompts could return different mock images for better demo
            if (prompt.toLowerCase().contains("traditional") || prompt.toLowerCase().contains("ethiopian")) {
                return new AIImageResponse("https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1000&auto=format&fit=crop");
            }
            return new AIImageResponse("https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=1000&auto=format&fit=crop");
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
