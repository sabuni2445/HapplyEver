package com.elegantevents.repository;

import com.elegantevents.model.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByCoupleClerkId(String coupleClerkId);
    List<Booking> findByVendorClerkId(String vendorClerkId);
    List<Booking> findByServiceId(Long serviceId);
    Optional<Booking> findByIdAndCoupleClerkId(Long id, String coupleClerkId);
    Optional<Booking> findByIdAndVendorClerkId(Long id, String vendorClerkId);
}









