package com.elegantevents.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "payments")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Payment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "wedding_id", nullable = false)
    private Long weddingId;
    
    @Column(name = "couple_clerk_id", nullable = false)
    private String coupleClerkId;
    
    @Column(name = "amount", nullable = false, precision = 15, scale = 2)
    private BigDecimal amount;
    
    @Column(name = "payment_number", nullable = false)
    private Integer paymentNumber; // 1, 2, 3, etc. (1/3, 2/3, 3/3)
    
    @Column(name = "total_payments", nullable = false)
    private Integer totalPayments; // Total number of payments (3, 4, etc.)
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private PaymentStatus status;
    
    @Column(name = "due_date")
    private LocalDateTime dueDate;
    
    @Column(name = "paid_date")
    private LocalDateTime paidDate;
    
    @Column(name = "chapa_transaction_id")
    private String chapaTransactionId;
    
    @Column(name = "chapa_reference", length = 100)
    private String chapaReference;
    
    @Column(name = "description", columnDefinition = "TEXT")
    private String description;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
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
    
    public enum PaymentStatus {
        PENDING,
        PAID,
        FAILED,
        CANCELLED
    }
}









