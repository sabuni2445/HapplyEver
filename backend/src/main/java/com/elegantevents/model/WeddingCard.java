package com.elegantevents.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "wedding_cards")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeddingCard {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "wedding_id", nullable = false, unique = true)
    private Long weddingId;
    
    @Column(name = "couple_clerk_id", nullable = false)
    private String coupleClerkId;
    
    @Column(name = "theme", nullable = false)
    private String theme;
    
    @Column(name = "card_design", columnDefinition = "LONGTEXT")
    private String cardDesign; // JSON string for card customization
    
    @Column(name = "background_image", columnDefinition = "LONGTEXT")
    private String backgroundImage; // Base64 encoded image or URL
    
    @Column(name = "background_video", columnDefinition = "LONGTEXT")
    private String backgroundVideo; // Base64 encoded video or URL
    
    @Column(name = "custom_text", columnDefinition = "TEXT")
    private String customText; // Custom message text
    
    @Column(name = "text_color")
    private String textColor; // Hex color code
    
    @Column(name = "background_color")
    private String backgroundColor; // Hex color code
    
    @Column(name = "accent_color")
    private String accentColor; // Hex color code
    
    @Column(name = "font_size")
    private String fontSize;
    
    @Column(name = "name_font_size")
    private String nameFontSize;
    
    @Column(name = "font_family")
    private String fontFamily;
    
    @Column(name = "text_align")
    private String textAlign;
    
    @Column(name = "overlay_opacity")
    private Double overlayOpacity;
    
    @Column(name = "digital_card_enabled", nullable = false)
    private Boolean digitalCardEnabled = false;
    
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

