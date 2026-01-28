package com.elegantevents.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "services")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Service {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "vendor_id", nullable = false)
    private Long vendorId;
    
    @Column(name = "clerk_id", nullable = false)
    private String clerkId;
    
    @Column(name = "service_name", nullable = false)
    private String serviceName;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private ServiceStatus status;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status", nullable = false)
    private AvailabilityStatus availabilityStatus = AvailabilityStatus.AVAILABLE;
    
    @Column(name = "category")
    private String category;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "price", columnDefinition = "DECIMAL(10,2)")
    private Double price;
    
    @Column(name = "amount")
    private String amount;
    
    @Column(name = "duration")
    private String duration;
    
    @Column(name = "location")
    private String location;
    
    @Column(name = "availability")
    private String availability;
    
    @Column(name = "image_url", columnDefinition = "LONGTEXT")
    private String imageUrl;
    
    @Column(name = "video_url", columnDefinition = "LONGTEXT")
    private String videoUrl;
    
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
    
    public enum ServiceStatus {
        ACTIVE,
        INACTIVE,
        PENDING
    }
    
    public enum AvailabilityStatus {
        AVAILABLE,
        BOOKED,
        UNAVAILABLE
    }
}

