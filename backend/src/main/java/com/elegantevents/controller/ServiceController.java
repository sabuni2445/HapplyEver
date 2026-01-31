package com.elegantevents.controller;

import com.elegantevents.dto.ServiceRequest;
import com.elegantevents.service.ServiceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/services")
public class ServiceController {
    
    private final ServiceService serviceService;
    
    public ServiceController(ServiceService serviceService) {
        this.serviceService = serviceService;
    }
    
    @PostMapping("/{clerkId}")
    public ResponseEntity<Map<String, Object>> createService(
            @PathVariable String clerkId,
            @Valid @RequestBody ServiceRequest request) {
        try {
            com.elegantevents.model.Service service = serviceService.createService(clerkId, request);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("service", service);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
    
    @GetMapping("/{clerkId}")
    public ResponseEntity<List<com.elegantevents.model.Service>> getServices(@PathVariable String clerkId) {
        List<com.elegantevents.model.Service> services = serviceService.getServicesByClerkId(clerkId);
        return ResponseEntity.ok(services);
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<com.elegantevents.model.Service>> getAllServices() {
        List<com.elegantevents.model.Service> allServices = serviceService.getAllActiveServices();
        return ResponseEntity.ok(allServices);
    }
    
    @GetMapping("/id/{id}")
    public ResponseEntity<com.elegantevents.model.Service> getServiceById(@PathVariable Long id) {
        try {
            com.elegantevents.model.Service service = serviceService.getServiceById(id);
            return ResponseEntity.ok(service);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{clerkId}/{id}")
    public ResponseEntity<com.elegantevents.model.Service> getService(@PathVariable String clerkId, @PathVariable Long id) {
        try {
            com.elegantevents.model.Service service = serviceService.getServiceById(id, clerkId);
            return ResponseEntity.ok(service);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PutMapping("/{clerkId}/{id}")
    public ResponseEntity<Map<String, Object>> updateService(
            @PathVariable String clerkId,
            @PathVariable Long id,
            @Valid @RequestBody ServiceRequest request) {
        try {
            com.elegantevents.model.Service service = serviceService.updateService(id, clerkId, request);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("service", service);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
    
    @PatchMapping("/{clerkId}/{id}/status")
    public ResponseEntity<Map<String, Object>> updateServiceStatus(
            @PathVariable String clerkId,
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        try {
            String availabilityStatus = request.get("availabilityStatus");
            com.elegantevents.model.Service service = serviceService.updateAvailabilityStatus(id, clerkId, availabilityStatus);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("service", service);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @DeleteMapping("/{clerkId}/{id}")
    public ResponseEntity<Map<String, Object>> deleteService(
            @PathVariable String clerkId,
            @PathVariable Long id) {
        try {
            serviceService.deleteService(id, clerkId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Service deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
}

