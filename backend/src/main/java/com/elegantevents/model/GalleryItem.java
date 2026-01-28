package com.elegantevents.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "gallery_items")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class GalleryItem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "wedding_id", nullable = false)
    private Long weddingId;
    
    @Column(name = "uploaded_by_clerk_id", nullable = false)
    private String uploadedByClerkId;
    
    @Column(name = "file_url", columnDefinition = "LONGTEXT", nullable = false)
    private String fileUrl; // Base64 encoded or URL
    
    @Column(name = "file_type", nullable = false)
    @Enumerated(EnumType.STRING)
    private FileType fileType; // IMAGE or VIDEO
    
    @Column(name = "caption", columnDefinition = "TEXT")
    private String caption;
    
    @Column(name = "is_approved", nullable = false)
    private Boolean isApproved = true; // Admin can mark as inappropriate
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum FileType {
        IMAGE, VIDEO
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









