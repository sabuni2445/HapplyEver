package com.elegantevents.controller;

import com.elegantevents.dto.RatingRequest;
import com.elegantevents.model.Rating;
import com.elegantevents.service.RatingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ratings")
@CrossOrigin(origins = "${app.frontend.url:http://localhost:5173}")
public class RatingController {
    
    private final RatingService ratingService;
    
    public RatingController(RatingService ratingService) {
        this.ratingService = ratingService;
    }
    
    @PostMapping("/couple/{coupleClerkId}")
    public ResponseEntity<Map<String, Object>> createRating(
            @PathVariable String coupleClerkId,
            @Valid @RequestBody RatingRequest request) {
        try {
            Rating rating = ratingService.createOrUpdateRating(coupleClerkId, request);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("rating", rating);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @GetMapping("/service/{serviceId}")
    public ResponseEntity<List<Rating>> getServiceRatings(@PathVariable Long serviceId) {
        List<Rating> ratings = ratingService.getRatingsByService(serviceId);
        return ResponseEntity.ok(ratings);
    }
    
    @GetMapping("/service/{serviceId}/average")
    public ResponseEntity<Map<String, Object>> getAverageRating(@PathVariable Long serviceId) {
        Double average = ratingService.getAverageRating(serviceId);
        Map<String, Object> response = new HashMap<>();
        response.put("average", average != null ? average : 0.0);
        response.put("count", ratingService.getRatingsByService(serviceId).size());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/vendor/{vendorClerkId}")
    public ResponseEntity<List<Rating>> getVendorRatings(@PathVariable String vendorClerkId) {
        List<Rating> ratings = ratingService.getRatingsByVendor(vendorClerkId);
        return ResponseEntity.ok(ratings);
    }
}









