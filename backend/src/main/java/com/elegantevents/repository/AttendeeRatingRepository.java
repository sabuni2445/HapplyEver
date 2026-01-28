package com.elegantevents.repository;

import com.elegantevents.model.AttendeeRating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AttendeeRatingRepository extends JpaRepository<AttendeeRating, Long> {
    List<AttendeeRating> findByWeddingId(Long weddingId);
    List<AttendeeRating> findByGuestId(Long guestId);
    Optional<AttendeeRating> findByGuestIdAndRatedTypeAndRatedId(Long guestId, AttendeeRating.RatedType ratedType, String ratedId);
    List<AttendeeRating> findByRatedTypeAndRatedId(AttendeeRating.RatedType ratedType, String ratedId);
}









