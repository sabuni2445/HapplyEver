package com.elegantevents.controller;

import com.elegantevents.model.User;
import com.elegantevents.model.VendorPackageOrder;
import com.elegantevents.service.VendorPackageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/vendor-packages")
public class VendorPackageController {

    private final VendorPackageService packageService;

    public VendorPackageController(VendorPackageService packageService) {
        this.packageService = packageService;
    }

    @PostMapping("/initialize")
    public ResponseEntity<Map<String, Object>> initializeUpgrade(@RequestBody Map<String, Object> request) {
        try {
            String clerkId = (String) request.get("clerkId");
            User.PackageType type = User.PackageType.valueOf((String) request.get("type"));
            VendorPackageOrder.Duration duration = VendorPackageOrder.Duration.valueOf((String) request.get("duration"));
            Double amount = Double.valueOf(request.get("amount").toString());
            
            Map<String, Object> response = packageService.initializePackageUpgrade(clerkId, type, duration, amount);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/manual-request")
    public ResponseEntity<Map<String, Object>> manualRequest(@RequestBody Map<String, Object> request) {
        try {
            String clerkId = (String) request.get("clerkId");
            User.PackageType type = User.PackageType.valueOf((String) request.get("type"));
            VendorPackageOrder.Duration duration = VendorPackageOrder.Duration.valueOf((String) request.get("duration"));
            Double amount = Double.valueOf(request.get("amount").toString());
            
            packageService.requestManualUpgrade(clerkId, type, duration, amount);
            return ResponseEntity.ok(Map.of("success", true, "message", "Request sent to admin for manual approval."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, Object>> verifyPayment(@RequestParam("txRef") String txRef) {
        try {
            packageService.verifyAndActivatePackage(txRef);
            return ResponseEntity.ok(Map.of("success", true, "status", "PAID"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "error", e.getMessage()));
        }
    }

    // Admin endpoint
    @PostMapping("/approve-manual/{orderId}")
    public ResponseEntity<Map<String, Object>> approveManual(@PathVariable Long orderId) {
        try {
            packageService.approveManualUpgrade(orderId);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
