package com.elegantevents.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "meeting_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class MeetingRequest {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne
    @JoinColumn(name = "couple_id", nullable = false)
    private User couple;
    
    @ManyToOne
    @JoinColumn(name = "manager_id")
    private User manager;
    
    @Column(name = "meeting_time", nullable = false)
    private LocalDateTime meetingTime;
    
    @Column(name = "purpose", length = 500)
    private String purpose;
    
    @Column(name = "jitsi_link")
    private String jitsiLink;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status")
    private MeetingStatus status = MeetingStatus.PENDING;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "initiator")
    private String initiator; // "COUPLE" or "MANAGER"

    @Column(name = "rejection_reason", length = 500)
    private String rejectionReason;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
    
    public enum MeetingStatus {
        PENDING,
        APPROVED,
        REJECTED,
        COMPLETED,
        CANCELLED
    }
}
