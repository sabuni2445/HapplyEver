package com.elegantevents.controller;

import com.elegantevents.model.WeddingAssignment;
import com.elegantevents.service.WeddingAssignmentService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/assignments")
public class WeddingAssignmentController {
    
    private final WeddingAssignmentService assignmentService;
    
    public WeddingAssignmentController(WeddingAssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }
    
    @PostMapping("/wedding/{weddingId}/manager/{managerClerkId}")
    public ResponseEntity<Map<String, Object>> assignToManager(
            @PathVariable Long weddingId,
            @PathVariable String managerClerkId,
            @RequestParam String adminClerkId) {
        try {
            WeddingAssignment assignment = assignmentService.assignWeddingToManager(weddingId, managerClerkId, adminClerkId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("assignment", assignment);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @PostMapping("/wedding/{weddingId}/protocol/{protocolClerkId}")
    public ResponseEntity<Map<String, Object>> assignProtocol(
            @PathVariable Long weddingId,
            @PathVariable String protocolClerkId,
            @RequestParam String managerClerkId,
            @RequestParam(required = false) String protocolJob) {
        try {
            WeddingAssignment assignment = assignmentService.assignProtocolToWedding(weddingId, protocolClerkId, managerClerkId, protocolJob);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("assignment", assignment);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<WeddingAssignment>> getAllAssignments() {
        return ResponseEntity.ok(assignmentService.getAllAssignments());
    }
    
    @GetMapping("/manager/{managerClerkId}")
    public ResponseEntity<List<WeddingAssignment>> getManagerAssignments(@PathVariable String managerClerkId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByManager(managerClerkId));
    }
    
    @GetMapping("/protocol/{protocolClerkId}")
    public ResponseEntity<List<WeddingAssignment>> getProtocolAssignments(@PathVariable String protocolClerkId) {
        return ResponseEntity.ok(assignmentService.getAssignmentsByProtocol(protocolClerkId));
    }
    
    @GetMapping("/wedding/{weddingId}")
    public ResponseEntity<WeddingAssignment> getAssignmentByWedding(@PathVariable Long weddingId) {
        try {
            return ResponseEntity.ok(assignmentService.getAssignmentByWedding(weddingId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/wedding/couple/{clerkId}")
    public ResponseEntity<WeddingAssignment> getAssignmentByCouple(@PathVariable String clerkId) {
        try {
            return ResponseEntity.ok(assignmentService.getAssignmentByCouple(clerkId));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PatchMapping("/wedding/{weddingId}/complete")
    public ResponseEntity<Map<String, Object>> completeWedding(
            @PathVariable Long weddingId,
            @RequestParam String managerClerkId,
            @RequestParam Integer rating,
            @RequestBody(required = false) Map<String, String> body) {
        try {
            String feedback = body != null ? body.get("feedback") : "";
            WeddingAssignment assignment = assignmentService.completeWedding(weddingId, managerClerkId, rating, feedback);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("assignment", assignment);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}









