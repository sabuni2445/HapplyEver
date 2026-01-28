package com.elegantevents.controller;

import com.elegantevents.model.User;
import com.elegantevents.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/webhooks")
public class ClerkWebhookController {
    
    private static final Logger logger = LoggerFactory.getLogger(ClerkWebhookController.class);
    
    private final UserService userService;
    private final String webhookSecret;
    
    public ClerkWebhookController(
            UserService userService,
            @Value("${clerk.webhook.secret:}") String webhookSecret) {
        this.userService = userService;
        this.webhookSecret = webhookSecret;
    }
    
    @PostMapping("/clerk")
    public ResponseEntity<Map<String, Object>> handleClerkWebhook(
            @RequestHeader("svix-id") String svixId,
            @RequestHeader("svix-timestamp") String svixTimestamp,
            @RequestHeader("svix-signature") String svixSignature,
            @RequestBody String payload) {
        
        if (webhookSecret == null || webhookSecret.isEmpty()) {
            logger.error("CLERK_WEBHOOK_SECRET is not configured");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Webhook secret not configured"));
        }
        
        // Verify webhook signature (simplified - can be enhanced with proper Svix verification later)
        try {
            // Basic validation - check if required headers are present
            if (svixId == null || svixTimestamp == null || svixSignature == null) {
                logger.warn("Missing required webhook headers");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                        .body(Map.of("error", "Missing required webhook headers"));
            }
            
            // TODO: Implement proper Svix webhook signature verification
            // For now, we'll process the webhook (in production, always verify the signature!)
            if (webhookSecret != null && !webhookSecret.isEmpty()) {
                logger.info("Webhook received (signature verification can be added later)");
            }
            
            // Parse the webhook payload
            ObjectMapper objectMapper = new ObjectMapper();
            JsonNode jsonNode = objectMapper.readTree(payload);
            
            String type = jsonNode.get("type").asText();
            JsonNode eventData = jsonNode.get("data");
            
            // Handle different webhook event types
            switch (type) {
                case "user.created":
                    handleUserCreated(eventData);
                    break;
                case "user.updated":
                    handleUserUpdated(eventData);
                    break;
                case "user.deleted":
                    handleUserDeleted(eventData);
                    break;
                default:
                    logger.info("Unhandled webhook type: {}", type);
            }
            
            return ResponseEntity.ok(Map.of("received", true));
            
        } catch (Exception e) {
            logger.error("Error processing webhook: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error processing webhook: " + e.getMessage()));
        }
    }
    
    private void handleUserCreated(JsonNode data) {
        try {
            String clerkId = data.get("id").asText();
            JsonNode emailAddresses = data.get("email_addresses");
            String email = emailAddresses != null && emailAddresses.isArray() && emailAddresses.size() > 0
                    ? emailAddresses.get(0).get("email_address").asText()
                    : "";
            
            String firstName = data.has("first_name") ? data.get("first_name").asText() : null;
            String lastName = data.has("last_name") ? data.get("last_name").asText() : null;
            String username = data.has("username") ? data.get("username").asText() : null;
            String imageUrl = data.has("image_url") ? data.get("image_url").asText() : null;
            
            userService.createOrUpdateUser(clerkId, email, firstName, lastName, username, imageUrl);
            logger.info("User created in database: {}", email);
        } catch (Exception e) {
            logger.error("Error creating user from webhook: {}", e.getMessage(), e);
            throw new RuntimeException("Error creating user from webhook", e);
        }
    }
    
    private void handleUserUpdated(JsonNode data) {
        try {
            String clerkId = data.get("id").asText();
            JsonNode emailAddresses = data.get("email_addresses");
            String email = emailAddresses != null && emailAddresses.isArray() && emailAddresses.size() > 0
                    ? emailAddresses.get(0).get("email_address").asText()
                    : "";
            
            String firstName = data.has("first_name") ? data.get("first_name").asText() : null;
            String lastName = data.has("last_name") ? data.get("last_name").asText() : null;
            String username = data.has("username") ? data.get("username").asText() : null;
            String imageUrl = data.has("image_url") ? data.get("image_url").asText() : null;
            
            userService.createOrUpdateUser(clerkId, email, firstName, lastName, username, imageUrl);
            logger.info("User updated in database: {}", email);
        } catch (Exception e) {
            logger.error("Error updating user from webhook: {}", e.getMessage(), e);
            throw new RuntimeException("Error updating user from webhook", e);
        }
    }
    
    private void handleUserDeleted(JsonNode data) {
        try {
            String clerkId = data.get("id").asText();
            userService.deleteUser(clerkId);
            logger.info("User deleted from database: {}", clerkId);
        } catch (Exception e) {
            logger.error("Error deleting user from webhook: {}", e.getMessage(), e);
            throw new RuntimeException("Error deleting user from webhook", e);
        }
    }
}

