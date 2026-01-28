package com.elegantevents.dto;

import com.elegantevents.model.GalleryItem;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GalleryItemRequest {
    private Long weddingId;
    private String fileUrl; // Base64 encoded image/video
    private GalleryItem.FileType fileType;
    private String caption;
}









