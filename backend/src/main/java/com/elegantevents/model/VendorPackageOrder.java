package com.elegantevents.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_package_orders")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorPackageOrder {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "clerk_id", nullable = false)
    private String clerkId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "package_type", nullable = false)
    private User.PackageType packageType;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "duration", nullable = false)
    private Duration duration; // MONTH, YEAR
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderStatus status = OrderStatus.PENDING;
    
    @Column(name = "amount", nullable = false)
    private Double amount;
    
    @Column(name = "tx_ref", unique = true)
    private String txRef;
    
    @Column(name = "expiry_date")
    private LocalDateTime expiryDate;
    
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
    
    public enum Duration {
        MONTH_1,
        MONTH_6,
        MONTH_12
    }
    
    public enum OrderStatus {
        PENDING,
        PAID,
        MANUAL_PENDING,
        EXPIRED,
        CANCELLED
    }
}
