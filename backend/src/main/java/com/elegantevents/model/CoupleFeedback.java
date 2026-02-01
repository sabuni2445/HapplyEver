package com.elegantevents.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "couple_feedbacks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class CoupleFeedback {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "wedding_id", nullable = false)
    private Long weddingId;
    
    @Column(name = "couple_clerk_id", nullable = false)
    private String coupleClerkId;
    
    @Column(name = "category", nullable = false)
    private String category; // WEDDING, APP, MANAGER, PROTOCOL, SERVICE
    
    @Column(name = "target_id") // Clerk ID or Service ID if applicable
    private String targetId;
    
    @Column(name = "rating", nullable = false)
    private Integer rating;
    
    @Column(name = "comment", columnDefinition = "TEXT")
    private String comment;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
