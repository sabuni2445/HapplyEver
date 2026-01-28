package com.elegantevents.controller;

import com.elegantevents.dto.WeddingCardRequest;
import com.elegantevents.model.WeddingCard;
import com.elegantevents.service.WeddingCardService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/wedding-cards")
@CrossOrigin(origins = "${app.frontend.url:http://localhost:5173}")
public class WeddingCardController {
    
    private final WeddingCardService weddingCardService;
    
    public WeddingCardController(WeddingCardService weddingCardService) {
        this.weddingCardService = weddingCardService;
    }
    
    @PostMapping("/{coupleClerkId}")
    public ResponseEntity<Map<String, Object>> createOrUpdateWeddingCard(
            @PathVariable String coupleClerkId,
            @Valid @RequestBody WeddingCardRequest request) {
        try {
            WeddingCard card = weddingCardService.createOrUpdateWeddingCard(coupleClerkId, request);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("card", card);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
    
    @GetMapping("/{coupleClerkId}")
    public ResponseEntity<WeddingCard> getWeddingCard(@PathVariable String coupleClerkId) {
        try {
            WeddingCard card = weddingCardService.getWeddingCardByCouple(coupleClerkId);
            return ResponseEntity.ok(card);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}









