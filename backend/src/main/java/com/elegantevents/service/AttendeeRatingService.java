package com.elegantevents.service;

import com.elegantevents.dto.AttendeeRatingRequest;
import com.elegantevents.model.AttendeeRating;
import com.elegantevents.repository.AttendeeRatingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class AttendeeRatingService {
    
    private final AttendeeRatingRepository ratingRepository;
    
    public AttendeeRatingService(AttendeeRatingRepository ratingRepository) {
        this.ratingRepository = ratingRepository;
    }
    
    public AttendeeRating createOrUpdateRating(AttendeeRatingRequest request) {
        Optional<AttendeeRating> existing = ratingRepository.findByGuestIdAndRatedTypeAndRatedId(
            request.getGuestId(),
            request.getRatedType(),
            request.getRatedId()
        );
        
        AttendeeRating rating = existing.map(r -> {
            r.setRating(request.getRating());
            r.setComment(request.getComment());
            return r;
        }).orElseGet(() -> {
            AttendeeRating newRating = new AttendeeRating();
            newRating.setWeddingId(request.getWeddingId());
            newRating.setGuestId(request.getGuestId());
            newRating.setRatedType(request.getRatedType());
            newRating.setRatedId(request.getRatedId());
            newRating.setRating(request.getRating());
            newRating.setComment(request.getComment());
            return newRating;
        });
        
        return ratingRepository.save(rating);
    }
    
    @Transactional(readOnly = true)
    public List<AttendeeRating> getRatingsByWedding(Long weddingId) {
        return ratingRepository.findByWeddingId(weddingId);
    }
    
    @Transactional(readOnly = true)
    public List<AttendeeRating> getRatingsByGuest(Long guestId) {
        return ratingRepository.findByGuestId(guestId);
    }
    
    @Transactional(readOnly = true)
    public List<AttendeeRating> getRatingsByRated(AttendeeRating.RatedType ratedType, String ratedId) {
        return ratingRepository.findByRatedTypeAndRatedId(ratedType, ratedId);
    }
}









