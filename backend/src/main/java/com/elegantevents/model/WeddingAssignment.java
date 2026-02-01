package com.elegantevents.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "wedding_assignments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeddingAssignment {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "wedding_id", nullable = false)
    private Long weddingId;
    
    @Column(name = "couple_clerk_id", nullable = false)
    private String coupleClerkId;
    
    @Column(name = "manager_clerk_id")
    private String managerClerkId;
    
    @Column(name = "protocol_clerk_id")
    private String protocolClerkId;
    
    @Column(name = "protocol_job")
    private String protocolJob;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private AssignmentStatus status = AssignmentStatus.PENDING;
    
    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @Column(name = "protocol_rating")
    private Integer protocolRating;

    @Column(name = "protocol_feedback", columnDefinition = "TEXT")
    private String protocolFeedback;
    
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
    
    public enum AssignmentStatus {
        PENDING,
        ASSIGNED_TO_MANAGER,
        ASSIGNED_TO_PROTOCOL,
        COMPLETED
    }
}









