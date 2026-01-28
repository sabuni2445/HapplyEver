package com.elegantevents.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "users", uniqueConstraints = {
    @UniqueConstraint(columnNames = "clerkId", name = "uk_clerk_id"),
    @UniqueConstraint(columnNames = "email", name = "uk_email")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String clerkId; // Nullable for attendees without Clerk accounts
    
    @Email
    @Column(unique = true)
    private String email; // Nullable for attendees with only phone
    
    @Column(name = "first_name")
    private String firstName;
    
    @Column(name = "last_name")
    private String lastName;
    
    @Column(name = "username")
    private String username;
    
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;
    
    @Column(name = "phone_number")
    private String phoneNumber;
    
    @Column(name = "password")
    private String password; // Optional password for DB-based login (manager, protocol, admin, attendee)
    
    @Enumerated(EnumType.STRING)
    @Column(name = "selected_role")
    private UserRole selectedRole;
    
    @Column(name = "profile_completed", nullable = false)
    private Boolean profileCompleted = false;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    public enum UserRole {
        ADMIN,
        MANAGER,
        PROTOCOL,
        ATTENDEE,
        VENDOR,
        USER  // For couples
    }
}


