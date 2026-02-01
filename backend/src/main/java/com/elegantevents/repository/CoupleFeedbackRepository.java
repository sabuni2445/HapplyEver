package com.elegantevents.repository;

import com.elegantevents.model.CoupleFeedback;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CoupleFeedbackRepository extends JpaRepository<CoupleFeedback, Long> {
    List<CoupleFeedback> findByWeddingId(Long weddingId);
    List<CoupleFeedback> findByCoupleClerkId(String coupleClerkId);
    List<CoupleFeedback> findByTargetId(String targetId);
}
