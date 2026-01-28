package com.elegantevents.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "weddings")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Wedding {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private Long userId;
    
    @Column(name = "clerk_id", nullable = false)
    private String clerkId;
    
    @Column(name = "partners_name")
    private String partnersName;
    
    @Column(name = "wedding_date")
    private LocalDate weddingDate;
    
    @Column(name = "wedding_time")
    private LocalTime weddingTime;
    
    @Column(name = "location")
    private String location;
    
    @Column(name = "venue")
    private String venue;
    
    @Column(name = "budget", columnDefinition = "DECIMAL(10,2)")
    private Double budget;
    
    @Column(name = "number_of_guests")
    private Integer numberOfGuests;
    
    @Column(name = "theme")
    private String theme;
    
    @Column(name = "catering")
    private String catering;
    
    @Column(name = "decorations", columnDefinition = "TEXT")
    private String decorations;
    
    @Column(name = "music")
    private String music;
    
    @Column(name = "photography")
    private String photography;
    
    @Column(name = "rules", columnDefinition = "TEXT")
    private String rules;
    
    @Column(name = "additional_notes", columnDefinition = "TEXT")
    private String additionalNotes;
    
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
}









