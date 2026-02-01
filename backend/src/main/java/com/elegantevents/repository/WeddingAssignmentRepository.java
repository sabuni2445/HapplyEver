package com.elegantevents.repository;

import com.elegantevents.model.WeddingAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WeddingAssignmentRepository extends JpaRepository<WeddingAssignment, Long> {
    Optional<WeddingAssignment> findByWeddingId(Long weddingId);
    Optional<WeddingAssignment> findByCoupleClerkId(String coupleClerkId);
    List<WeddingAssignment> findByManagerClerkId(String managerClerkId);
    List<WeddingAssignment> findByProtocolClerkId(String protocolClerkId);
    List<WeddingAssignment> findAll();
}









