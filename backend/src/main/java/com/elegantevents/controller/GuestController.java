package com.elegantevents.controller;

import com.elegantevents.dto.GuestRequest;
import com.elegantevents.model.Guest;
import com.elegantevents.service.GuestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/guests")
public class GuestController {
    
    private final GuestService guestService;
    
    public GuestController(GuestService guestService) {
        this.guestService = guestService;
    }
    
    @PostMapping("/{coupleClerkId}")
    public ResponseEntity<Map<String, Object>> createGuests(
            @PathVariable String coupleClerkId,
            @Valid @RequestBody GuestRequest request) {
        try {
            List<Guest> guests = guestService.createGuests(coupleClerkId, request);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("guests", guests);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
    
    @GetMapping("/{coupleClerkId}")
    public ResponseEntity<List<Guest>> getGuestsByCouple(@PathVariable String coupleClerkId) {
        List<Guest> guests = guestService.getGuestsByCouple(coupleClerkId);
        return ResponseEntity.ok(guests);
    }
    
    @GetMapping("/wedding/{weddingId}")
    public ResponseEntity<List<Guest>> getGuestsByWedding(@PathVariable Long weddingId) {
        List<Guest> guests = guestService.getGuestsByWedding(weddingId);
        return ResponseEntity.ok(guests);
    }
    
    @GetMapping("/code/{uniqueCode}")
    public ResponseEntity<Guest> getGuestByCode(@PathVariable String uniqueCode) {
        try {
            Guest guest = guestService.getGuestByUniqueCode(uniqueCode);
            return ResponseEntity.ok(guest);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{guestId}/check-in")
    public ResponseEntity<Guest> checkInGuest(@PathVariable Long guestId) {
        try {
            Guest guest = guestService.checkInGuest(guestId);
            return ResponseEntity.ok(guest);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}









