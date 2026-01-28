package com.elegantevents.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeddingCardRequest {
    private String theme;
    private String cardDesign; // JSON string for customization
    private Boolean digitalCardEnabled;
    private String backgroundImage; // Base64 encoded image or URL
    private String backgroundVideo; // Base64 encoded video or URL
    private String customText; // Custom message text
    private String textColor; // Hex color code
    private String backgroundColor; // Hex color code
    private String accentColor; // Hex color code
    private String fontSize;
    private String nameFontSize;
    private String fontFamily;
    private String textAlign;
    private Double overlayOpacity;
}

