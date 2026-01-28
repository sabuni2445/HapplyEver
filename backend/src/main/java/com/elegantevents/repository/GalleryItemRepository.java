package com.elegantevents.repository;

import com.elegantevents.model.GalleryItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface GalleryItemRepository extends JpaRepository<GalleryItem, Long> {
    List<GalleryItem> findByWeddingId(Long weddingId);
    List<GalleryItem> findByWeddingIdAndIsApprovedTrue(Long weddingId);
    List<GalleryItem> findByUploadedByClerkId(String clerkId);
}









