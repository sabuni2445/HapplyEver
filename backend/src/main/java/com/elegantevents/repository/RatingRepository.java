package com.elegantevents.repository;

import com.elegantevents.model.Rating;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<Rating, Long> {
    List<Rating> findByServiceId(Long serviceId);
    List<Rating> findByVendorClerkId(String vendorClerkId);
    Optional<Rating> findByBookingId(Long bookingId);
    Optional<Rating> findByServiceIdAndCoupleClerkId(Long serviceId, String coupleClerkId);
    
    @Query("SELECT AVG(r.rating) FROM Rating r WHERE r.serviceId = :serviceId")
    Double findAverageRatingByServiceId(@Param("serviceId") Long serviceId);
}









