package com.elegantevents.repository;

import com.elegantevents.model.Service;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceRepository extends JpaRepository<Service, Long> {
    List<Service> findByClerkId(String clerkId);
    Optional<Service> findByIdAndClerkId(Long id, String clerkId);
}









