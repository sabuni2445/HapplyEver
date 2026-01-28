package com.elegantevents.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "bookings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Booking {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "service_id", nullable = false)
    private Long serviceId;
    
    @Column(name = "vendor_clerk_id", nullable = false)
    private String vendorClerkId;
    
    @Column(name = "couple_clerk_id", nullable = false)
    private String coupleClerkId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private BookingStatus status;
    
    @Column(name = "event_date")
    private java.time.LocalDate eventDate;
    
    @Column(name = "event_time")
    private java.time.LocalTime eventTime;
    
    @Column(name = "location")
    private String location;
    
    @Column(name = "special_requests", columnDefinition = "TEXT")
    private String specialRequests;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    @Column(name = "responded_at")
    private LocalDateTime respondedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) {
            status = BookingStatus.PENDING;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        if (status != BookingStatus.PENDING && respondedAt == null) {
            respondedAt = LocalDateTime.now();
        }
    }
    
    public enum BookingStatus {
        PENDING,
        ACCEPTED,
        REJECTED,
        CANCELLED,
        COMPLETED
    }
}









