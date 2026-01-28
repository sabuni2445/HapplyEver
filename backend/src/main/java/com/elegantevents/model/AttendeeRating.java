package com.elegantevents.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "attendee_ratings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendeeRating {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "wedding_id", nullable = false)
    private Long weddingId;
    
    @Column(name = "guest_id", nullable = false)
    private Long guestId;
    
    @Column(name = "rated_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private RatedType ratedType; // PROTOCOL, WEDDING, COUPLE
    
    @Column(name = "rated_id") // Protocol clerkId, weddingId, or couple clerkId
    private String ratedId;
    
    @Column(name = "rating", nullable = false)
    private Integer rating; // 1-5 stars
    
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum RatedType {
        PROTOCOL, WEDDING, COUPLE
    }
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}









