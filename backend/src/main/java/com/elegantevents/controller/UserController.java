package com.elegantevents.controller;

import com.elegantevents.dto.UserResponse;
import com.elegantevents.dto.UserSyncRequest;
import com.elegantevents.model.User;
import com.elegantevents.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
public class UserController {
    
    private final UserService userService;
    
    public UserController(UserService userService) {
        this.userService = userService;
    }
    
    @PostMapping("/sync")
    public ResponseEntity<Map<String, Object>> syncUser(@Valid @RequestBody UserSyncRequest request) {
        try {
            UserResponse user = userService.syncUser(request);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", user);
            response.put("message", "User synced successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(errorResponse);
        }
    }
    
    @GetMapping("/clerk/{clerkId}")
    public ResponseEntity<UserResponse> getUserByClerkId(@PathVariable String clerkId) {
        try {
            UserResponse user = userService.getUserByClerkId(clerkId);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Long id) {
        try {
            UserResponse user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PatchMapping("/{clerkId}/role")
    public ResponseEntity<Map<String, Object>> updateUserRole(
            @PathVariable String clerkId,
            @RequestBody Map<String, String> request) {
        try {
            String roleStr = request.get("selectedRole");
            User.UserRole role = User.UserRole.valueOf(roleStr.toUpperCase());
            UserResponse user = userService.updateUserRole(clerkId, role);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", user);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Invalid role: " + request.get("selectedRole"));
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }

    @PatchMapping("/{clerkId}/package")
    public ResponseEntity<Map<String, Object>> updateUserPackage(
            @PathVariable String clerkId,
            @RequestBody Map<String, String> request) {
        try {
            String packageStr = request.get("packageType");
            User.PackageType packageType = User.PackageType.valueOf(packageStr.toUpperCase());
            UserResponse user = userService.updateUserPackage(clerkId, packageType);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", user);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", "Invalid package type: " + request.get("packageType"));
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
    
    @PatchMapping("/{clerkId}/profile")
    public ResponseEntity<Map<String, Object>> updateUserProfile(
            @PathVariable String clerkId,
            @RequestBody Map<String, Object> profileData) {
        try {
            User userUpdate = new User();
            if (profileData.containsKey("firstName")) {
                userUpdate.setFirstName((String) profileData.get("firstName"));
            }
            if (profileData.containsKey("lastName")) {
                userUpdate.setLastName((String) profileData.get("lastName"));
            }
            if (profileData.containsKey("phoneNumber")) {
                userUpdate.setPhoneNumber((String) profileData.get("phoneNumber"));
            }
            if (profileData.containsKey("imageUrl")) {
                userUpdate.setImageUrl((String) profileData.get("imageUrl"));
            }
            
            UserResponse user = userService.updateUserProfile(clerkId, userUpdate);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", user);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(errorResponse);
        }
    }
    
    @GetMapping("/all")
    public ResponseEntity<List<UserResponse>> getAllUsers(@RequestParam(required = false) String adminClerkId) {
        // Verify admin if provided
        if (adminClerkId != null) {
            try {
                UserResponse admin = userService.getUserByClerkId(adminClerkId);
                if (admin.getSelectedRole() != User.UserRole.ADMIN) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
                }
            } catch (RuntimeException e) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
            }
        }
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    @GetMapping("/role/{role}")
    public ResponseEntity<List<UserResponse>> getUsersByRole(@PathVariable String role) {
        try {
            User.UserRole userRole = User.UserRole.valueOf(role.toUpperCase());
            return ResponseEntity.ok(userService.getUsersByRole(userRole));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PostMapping("/create-manager")
    public ResponseEntity<Map<String, Object>> createManager(
            @RequestParam String adminClerkId,
            @RequestBody Map<String, String> userData) {
        try {
            UserResponse admin = userService.getUserByClerkId(adminClerkId);
            if (admin.getSelectedRole() != User.UserRole.ADMIN) {
                throw new RuntimeException("Only admins can create managers");
            }
            
            UserResponse user = userService.createOrUpdateUserWithPassword(
                userData.get("clerkId"),
                userData.get("email"),
                userData.get("firstName"),
                userData.get("lastName"),
                userData.get("username"),
                userData.get("imageUrl"),
                userData.get("password") // Optional password
            );
            
            // Set role to MANAGER
            UserResponse manager = userService.updateUserRole(user.getClerkId(), User.UserRole.MANAGER);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", manager);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @PostMapping("/create-protocol")
    public ResponseEntity<Map<String, Object>> createProtocol(
            @RequestParam String adminClerkId,
            @RequestBody Map<String, String> userData) {
        try {
            UserResponse admin = userService.getUserByClerkId(adminClerkId);
            if (admin.getSelectedRole() != User.UserRole.ADMIN) {
                throw new RuntimeException("Only admins can create protocol officers");
            }
            
            UserResponse user = userService.createOrUpdateUserWithPassword(
                userData.get("clerkId"),
                userData.get("email"),
                userData.get("firstName"),
                userData.get("lastName"),
                userData.get("username"),
                userData.get("imageUrl"),
                userData.get("password") // Optional password
            );
            
            // Set role to PROTOCOL
            UserResponse protocol = userService.updateUserRole(user.getClerkId(), User.UserRole.PROTOCOL);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", protocol);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @PostMapping("/set-password")
    public ResponseEntity<Map<String, Object>> setPassword(
            @RequestParam String adminClerkId,
            @RequestParam String targetClerkId,
            @RequestBody Map<String, String> passwordData) {
        try {
            UserResponse admin = userService.getUserByClerkId(adminClerkId);
            if (admin.getSelectedRole() != User.UserRole.ADMIN) {
                throw new RuntimeException("Only admins can set passwords");
            }
            
            String password = passwordData.get("password");
            if (password == null || password.isEmpty()) {
                throw new RuntimeException("Password is required");
            }
            
            UserResponse user = userService.setPassword(targetClerkId, password);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", user);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @DeleteMapping("/{clerkId}")
    public ResponseEntity<Map<String, Object>> deleteUser(
            @PathVariable String clerkId,
            @RequestParam String adminClerkId) {
        try {
            UserResponse admin = userService.getUserByClerkId(adminClerkId);
            if (admin.getSelectedRole() != User.UserRole.ADMIN) {
                throw new RuntimeException("Only admins can delete users");
            }
            
            userService.deleteUser(clerkId);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "User deleted successfully");
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> health() {
        Map<String, String> response = new HashMap<>();
        response.put("status", "OK");
        response.put("message", "User service is running");
        return ResponseEntity.ok(response);
    }
}


