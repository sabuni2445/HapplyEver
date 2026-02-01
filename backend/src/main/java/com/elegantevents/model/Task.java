package com.elegantevents.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TaskStatus status = TaskStatus.PENDING_ACCEPTANCE;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TaskCategory category = TaskCategory.GENERAL;

    @ManyToOne
    @JoinColumn(name = "wedding_id", nullable = false)
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Wedding wedding;
    
    // Assigned to specific protocol user
    @ManyToOne
    @JoinColumn(name = "assigned_protocol_id")
    @com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private User assignedProtocol;
    
    // Who is responsible? "MANAGER", "COUPLE", "PROTOCOL" (for display)
    @Column(name = "assigned_role")
    private String assignedRole;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "due_date")
    private LocalDateTime dueDate;
    
    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }

    public enum TaskStatus {
        PENDING,             // For backward compatibility
        PENDING_ACCEPTANCE,  // Waiting for protocol to accept
        ACCEPTED,            // Protocol accepted
        REJECTED,            // Protocol rejected
        IN_PROGRESS,         // Protocol working on it
        COMPLETED,           // Task completed
        CANCELLED            // Task cancelled
    }

    public enum TaskCategory {
        GENERAL,
        VIP,
        LOGISTICS,
        CATERING,
        SECURITY,
        QR_CODE,
        OTHER
    }
}
