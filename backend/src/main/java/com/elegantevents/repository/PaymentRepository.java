package com.elegantevents.repository;

import com.elegantevents.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByWeddingId(Long weddingId);
    List<Payment> findByCoupleClerkId(String coupleClerkId);
    List<Payment> findByWeddingIdAndStatus(Long weddingId, Payment.PaymentStatus status);
    Optional<Payment> findByChapaReference(String chapaReference);
    Optional<Payment> findByChapaTransactionId(String chapaTransactionId);
}









