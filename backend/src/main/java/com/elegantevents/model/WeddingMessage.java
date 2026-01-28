package com.elegantevents.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "wedding_messages")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeddingMessage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "wedding_id", nullable = false)
    private Long weddingId;
    
    @Column(name = "sender_clerk_id", nullable = false)
    private String senderClerkId; // Couple's clerkId
    
    @Column(name = "sender_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private SenderType senderType; // COUPLE, GUEST
    
    @Column(name = "recipient_type")
    @Enumerated(EnumType.STRING)
    private RecipientType recipientType; // ALL_GUESTS, SPECIFIC_GUEST
    
    @Column(name = "recipient_guest_id")
    private Long recipientGuestId; // If specific guest
    
    @Column(name = "message", columnDefinition = "TEXT", nullable = false)
    private String message;
    
    @Column(name = "is_broadcast", nullable = false)
    private Boolean isBroadcast = false; // true for "see you in 10 min" type messages
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum SenderType {
        COUPLE, GUEST
    }
    
    public enum RecipientType {
        ALL_GUESTS, SPECIFIC_GUEST
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









