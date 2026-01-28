package com.elegantevents.controller;

import com.elegantevents.dto.GalleryItemRequest;
import com.elegantevents.model.GalleryItem;
import com.elegantevents.model.User;
import com.elegantevents.service.GalleryService;
import com.elegantevents.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gallery")
@CrossOrigin(origins = "${app.frontend.url:http://localhost:5173}")
public class GalleryController {
    
    private final GalleryService galleryService;
    private final UserService userService;
    
    public GalleryController(GalleryService galleryService, UserService userService) {
        this.galleryService = galleryService;
        this.userService = userService;
    }
    
    @PostMapping("/upload")
    public ResponseEntity<Map<String, Object>> uploadItem(
            @RequestParam String clerkId,
            @RequestBody GalleryItemRequest request) {
        try {
            GalleryItem item = galleryService.uploadGalleryItem(clerkId, request);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("item", item);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @GetMapping("/wedding/{weddingId}")
    public ResponseEntity<List<GalleryItem>> getGalleryByWedding(
            @PathVariable Long weddingId,
            @RequestParam(required = false, defaultValue = "true") boolean approvedOnly) {
        return ResponseEntity.ok(galleryService.getGalleryByWedding(weddingId, approvedOnly));
    }
    
    @GetMapping("/user/{clerkId}")
    public ResponseEntity<List<GalleryItem>> getGalleryByUser(@PathVariable String clerkId) {
        return ResponseEntity.ok(galleryService.getGalleryByUser(clerkId));
    }
    
    @DeleteMapping("/{itemId}")
    public ResponseEntity<Map<String, Object>> deleteItem(
            @PathVariable Long itemId,
            @RequestParam String clerkId) {
        try {
            galleryService.deleteGalleryItem(itemId, clerkId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Item deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @PatchMapping("/{itemId}/approval")
    public ResponseEntity<Map<String, Object>> updateApproval(
            @PathVariable Long itemId,
            @RequestParam boolean isApproved,
            @RequestParam String adminClerkId) {
        try {
            // Verify admin
            var admin = userService.getUserByClerkId(adminClerkId);
            if (admin.getSelectedRole() != User.UserRole.ADMIN) {
                throw new RuntimeException("Only admins can moderate gallery items");
            }
            
            GalleryItem item = galleryService.updateApprovalStatus(itemId, isApproved, adminClerkId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("item", item);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}









