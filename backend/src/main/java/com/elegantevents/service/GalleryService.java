package com.elegantevents.service;

import com.elegantevents.dto.GalleryItemRequest;
import com.elegantevents.model.GalleryItem;
import com.elegantevents.model.Wedding;
import com.elegantevents.repository.GalleryItemRepository;
import com.elegantevents.repository.WeddingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class GalleryService {
    
    private final GalleryItemRepository galleryItemRepository;
    private final WeddingRepository weddingRepository;
    
    public GalleryService(GalleryItemRepository galleryItemRepository,
                         WeddingRepository weddingRepository) {
        this.galleryItemRepository = galleryItemRepository;
        this.weddingRepository = weddingRepository;
    }
    
    public GalleryItem uploadGalleryItem(String uploaderId, GalleryItemRequest request) {
        // Verify wedding exists and user has access
        Wedding wedding = weddingRepository.findById(request.getWeddingId())
                .orElseThrow(() -> new RuntimeException("Wedding not found"));
        
        // Verify wedding ID matches (for security)
        if (!wedding.getId().equals(request.getWeddingId())) {
            throw new RuntimeException("Invalid wedding access");
        }
        
        GalleryItem item = new GalleryItem();
        item.setWeddingId(request.getWeddingId());
        // uploaderId can be Clerk ID (for couples/vendors) or guest identifier (for attendees)
        item.setUploadedByClerkId(uploaderId);
        item.setFileUrl(request.getFileUrl());
        item.setFileType(request.getFileType());
        item.setCaption(request.getCaption());
        item.setIsApproved(true); // Auto-approve, admin can change later
        
        return galleryItemRepository.save(item);
    }
    
    @Transactional(readOnly = true)
    public List<GalleryItem> getGalleryByWedding(Long weddingId, boolean approvedOnly) {
        if (approvedOnly) {
            return galleryItemRepository.findByWeddingIdAndIsApprovedTrue(weddingId);
        }
        return galleryItemRepository.findByWeddingId(weddingId);
    }
    
    @Transactional(readOnly = true)
    public List<GalleryItem> getGalleryByUser(String clerkId) {
        return galleryItemRepository.findByUploadedByClerkId(clerkId);
    }
    
    public void deleteGalleryItem(Long itemId, String clerkId) {
        GalleryItem item = galleryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Gallery item not found"));
        
        // Only allow deletion by uploader or admin (check in controller)
        if (!item.getUploadedByClerkId().equals(clerkId)) {
            throw new RuntimeException("Unauthorized to delete this item");
        }
        
        galleryItemRepository.delete(item);
    }
    
    public GalleryItem updateApprovalStatus(Long itemId, boolean isApproved, String adminClerkId) {
        // Admin only - verify in controller
        GalleryItem item = galleryItemRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Gallery item not found"));
        
        item.setIsApproved(isApproved);
        return galleryItemRepository.save(item);
    }
}

