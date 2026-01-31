package com.elegantevents.repository;

import com.elegantevents.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByClerkId(String clerkId);
    Optional<User> findByEmail(String email);
    boolean existsByClerkId(String clerkId);
    boolean existsByEmail(String email);
    List<User> findBySelectedRole(User.UserRole role);

    @Query("SELECT u FROM User u WHERE u.packageExpiryDate IS NOT NULL AND u.packageExpiryDate < :now AND u.packageType != 'NORMAL'")
    List<User> findExpiredPackages(@Param("now") LocalDateTime now);
}


