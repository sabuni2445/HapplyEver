package com.elegantevents.repository;

import com.elegantevents.model.WeddingCard;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WeddingCardRepository extends JpaRepository<WeddingCard, Long> {
    Optional<WeddingCard> findByWeddingId(Long weddingId);
    Optional<WeddingCard> findByCoupleClerkId(String coupleClerkId);
}









