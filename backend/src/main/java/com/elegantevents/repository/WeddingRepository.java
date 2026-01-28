package com.elegantevents.repository;

import com.elegantevents.model.Wedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface WeddingRepository extends JpaRepository<Wedding, Long> {
    Optional<Wedding> findByClerkId(String clerkId);
    boolean existsByClerkId(String clerkId);
}









