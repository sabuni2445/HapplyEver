package com.elegantevents.service;

import com.elegantevents.dto.RatingRequest;
import com.elegantevents.model.Rating;
import com.elegantevents.repository.RatingRepository;
import com.elegantevents.repository.ServiceRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class RatingService {
    
    private final RatingRepository ratingRepository;
    private final ServiceRepository serviceRepository;
    
    public RatingService(RatingRepository ratingRepository, ServiceRepository serviceRepository) {
        this.ratingRepository = ratingRepository;
        this.serviceRepository = serviceRepository;
    }
    
    public Rating createOrUpdateRating(String coupleClerkId, RatingRequest request) {
        // Get service to find vendor
        com.elegantevents.model.Service service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));
        
        // Check if rating already exists
        Rating rating = ratingRepository.findByServiceIdAndCoupleClerkId(request.getServiceId(), coupleClerkId)
                .map(existing -> {
                    existing.setRating(request.getRating());
                    existing.setComment(request.getComment());
                    return existing;
                })
                .orElseGet(() -> {
                    Rating newRating = new Rating();
                    newRating.setServiceId(request.getServiceId());
                    newRating.setBookingId(request.getBookingId());
                    newRating.setCoupleClerkId(coupleClerkId);
                    newRating.setVendorClerkId(service.getClerkId());
                    newRating.setRating(request.getRating());
                    newRating.setComment(request.getComment());
                    return newRating;
                });
        
        return ratingRepository.save(rating);
    }
    
    @Transactional(readOnly = true)
    public List<Rating> getRatingsByService(Long serviceId) {
        return ratingRepository.findByServiceId(serviceId);
    }
    
    @Transactional(readOnly = true)
    public Double getAverageRating(Long serviceId) {
        return ratingRepository.findAverageRatingByServiceId(serviceId);
    }
    
    @Transactional(readOnly = true)
    public List<Rating> getRatingsByVendor(String vendorClerkId) {
        return ratingRepository.findByVendorClerkId(vendorClerkId);
    }
}

