package com.elegantevents.repository;

import com.elegantevents.model.Guest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface GuestRepository extends JpaRepository<Guest, Long> {
    List<Guest> findByCoupleClerkId(String coupleClerkId);
    List<Guest> findByWeddingId(Long weddingId);
    Optional<Guest> findByUniqueCode(String uniqueCode);
    boolean existsByUniqueCode(String uniqueCode);
}









