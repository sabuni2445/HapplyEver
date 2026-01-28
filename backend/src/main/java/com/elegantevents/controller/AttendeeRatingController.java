package com.elegantevents.controller;

import com.elegantevents.dto.AttendeeRatingRequest;
import com.elegantevents.model.AttendeeRating;
import com.elegantevents.service.AttendeeRatingService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/attendee-ratings")
@CrossOrigin(origins = "${app.frontend.url:http://localhost:5173}")
public class AttendeeRatingController {
    
    private final AttendeeRatingService ratingService;
    
    public AttendeeRatingController(AttendeeRatingService ratingService) {
        this.ratingService = ratingService;
    }
    
    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitRating(@RequestBody AttendeeRatingRequest request) {
        try {
            AttendeeRating rating = ratingService.createOrUpdateRating(request);
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
    
    @GetMapping("/wedding/{weddingId}")
    public ResponseEntity<List<AttendeeRating>> getRatingsByWedding(@PathVariable Long weddingId) {
        return ResponseEntity.ok(ratingService.getRatingsByWedding(weddingId));
    }
    
    @GetMapping("/guest/{guestId}")
    public ResponseEntity<List<AttendeeRating>> getRatingsByGuest(@PathVariable Long guestId) {
        return ResponseEntity.ok(ratingService.getRatingsByGuest(guestId));
    }
    
    @GetMapping("/rated/{ratedType}/{ratedId}")
    public ResponseEntity<List<AttendeeRating>> getRatingsByRated(
            @PathVariable AttendeeRating.RatedType ratedType,
            @PathVariable String ratedId) {
        return ResponseEntity.ok(ratingService.getRatingsByRated(ratedType, ratedId));
    }
}









