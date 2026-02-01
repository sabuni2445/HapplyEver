package com.elegantevents.controller;

import com.elegantevents.dto.WeddingRequest;
import com.elegantevents.model.Wedding;
import com.elegantevents.service.WeddingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/weddings")
public class WeddingController {
    
    private final WeddingService weddingService;
    
    public WeddingController(WeddingService weddingService) {
        this.weddingService = weddingService;
    }
    
    @PostMapping("/{clerkId}")
    public ResponseEntity<Map<String, Object>> createOrUpdateWedding(
            @PathVariable String clerkId,
            @Valid @RequestBody WeddingRequest request) {
        try {
            Wedding wedding = weddingService.createOrUpdateWedding(clerkId, request);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("wedding", wedding);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
    
    @GetMapping("/{clerkId}")
    public ResponseEntity<Wedding> getWedding(@PathVariable String clerkId) {
        try {
            Wedding wedding = weddingService.getWeddingByClerkId(clerkId);
            return ResponseEntity.ok(wedding);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<Wedding>> getAllWeddings() {
        return ResponseEntity.ok(weddingService.getAllWeddings());
    }
    
    @GetMapping("/id/{weddingId}")
    public ResponseEntity<Wedding> getWeddingById(@PathVariable Long weddingId) {
        try {
            Wedding wedding = weddingService.getWeddingById(weddingId);
            return ResponseEntity.ok(wedding);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{clerkId}")
    public ResponseEntity<Map<String, Object>> deleteWedding(@PathVariable String clerkId) {
        try {
            weddingService.deleteWedding(clerkId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Wedding deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    @PatchMapping("/{weddingId}/status")
    public ResponseEntity<Map<String, Object>> updateWeddingStatus(
            @PathVariable Long weddingId,
            @RequestBody Map<String, String> statusMap) {
        try {
            Wedding.WeddingStatus status = Wedding.WeddingStatus.valueOf(statusMap.get("status").toUpperCase());
            Wedding wedding = weddingService.updateStatus(weddingId, status);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("wedding", wedding);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}
