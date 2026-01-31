package com.elegantevents.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

@Service
public class ChapaPaymentService {
    
    private final RestTemplate restTemplate;
    
    public ChapaPaymentService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }
    
    @Value("${chapa.secret.key}")
    private String chapaSecretKey;
    
    @Value("${chapa.callback.url}")
    private String callbackUrl;
    
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;
    
    public Map<String, Object> initializePayment(
            String email,
            String firstName,
            String lastName,
            String phoneNumber,
            Double amount,
            String txRef,
            String returnUrl) {
        
        String url = "https://api.chapa.co/v1/transaction/initialize";
        
        Map<String, Object> payload = new HashMap<>();
        payload.put("amount", String.format("%.2f", amount));
        payload.put("currency", "ETB");
        payload.put("email", email);
        payload.put("first_name", firstName);
        payload.put("last_name", lastName);
        if (phoneNumber != null && !phoneNumber.isEmpty()) {
            // Basic sanitization: only keep + and digits
            String sanitizedPhone = phoneNumber.replaceAll("[^+\\d]", "");
            // Chapa expects a valid phone number. If it's too short or contains weird characters, skip it.
            if (sanitizedPhone.length() >= 9) {
                payload.put("phone_number", sanitizedPhone);
            }
        }
        payload.put("tx_ref", txRef);
        payload.put("callback_url", callbackUrl);
        payload.put("return_url", returnUrl != null ? returnUrl : (frontendUrl + "/couple/wedding-management"));
        
        Map<String, String> customization = new HashMap<>();
        customization.put("title", "Wedding Payment");
        customization.put("description", "Payment for wedding services");
        payload.put("customization", customization);
        
        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + chapaSecretKey);
        headers.setContentType(MediaType.APPLICATION_JSON);
        
        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);
        
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> responseBody = response.getBody();
                if ("success".equals(responseBody.get("status"))) {
                    Map<String, Object> data = (Map<String, Object>) responseBody.get("data");
                    Map<String, Object> result = new HashMap<>();
                    result.put("success", true);
                    result.put("checkout_url", data.get("checkout_url"));
                    result.put("tx_ref", txRef);
                    return result;
                }
            }
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", "Failed to initialize payment");
            return errorResult;
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", e.getMessage());
            return errorResult;
        }
    }

    /**
     * Verify a payment by tx_ref using Chapa's verify API.
     */
    public Map<String, Object> verifyPayment(String txRef) {
        String url = "https://api.chapa.co/v1/transaction/verify/" + txRef;

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "Bearer " + chapaSecretKey);

        HttpEntity<Void> request = new HttpEntity<>(headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", "Failed to verify payment");
            return errorResult;
        } catch (Exception e) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("success", false);
            errorResult.put("error", e.getMessage());
            return errorResult;
        }
    }
}

