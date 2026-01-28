package com.elegantevents.controller;

import com.elegantevents.dto.LoginRequest;
import com.elegantevents.dto.UserResponse;
import com.elegantevents.model.User;
import com.elegantevents.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "${app.frontend.url:http://localhost:5173}")
public class AuthController {
    
    private final UserService userService;
    
    public AuthController(UserService userService) {
        this.userService = userService;
    }
    
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@Valid @RequestBody LoginRequest request) {
        try {
            String email = request.getEmail();
            String password = request.getPassword();
            
            // Find user by email
            User user = userService.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Invalid email or password"));
            
            // TODO: Add password field to User model and implement proper password validation
            // For now, accept any password for testing (REMOVE IN PRODUCTION)
            // In production, use BCrypt to hash and verify passwords
            
            // For now, check if password matches (simple validation)
            // In production, use BCrypt password hashing
            // For DB-only users (manager, protocol, admin, attendee), check password field
            // Since we don't have password field yet, we'll use a simple check
            // You should add password hashing when adding password field to User model
            
            // Check if user has a role that supports DB login
            if (user.getSelectedRole() == null || 
                (user.getSelectedRole() != User.UserRole.MANAGER && 
                 user.getSelectedRole() != User.UserRole.PROTOCOL &&
                 user.getSelectedRole() != User.UserRole.ADMIN &&
                 user.getSelectedRole() != User.UserRole.ATTENDEE)) {
                throw new RuntimeException("This account cannot be accessed with password login. Please use Clerk.");
            }
            
            // Verify password
            if (user.getPassword() == null || user.getPassword().isEmpty()) {
                throw new RuntimeException("Password not set for this account. Please contact admin.");
            }
            
            if (!userService.verifyPassword(user, password)) {
                throw new RuntimeException("Invalid email or password");
            }
            
            UserResponse userResponse = UserResponse.fromEntity(user);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", userResponse);
            response.put("token", "db-auth-token"); // Simple token for now
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }
}

