package com.elegantevents.repository;

import com.elegantevents.model.WeddingMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WeddingMessageRepository extends JpaRepository<WeddingMessage, Long> {
    List<WeddingMessage> findByWeddingIdOrderByCreatedAtDesc(Long weddingId);
    List<WeddingMessage> findByWeddingIdAndRecipientGuestIdOrderByCreatedAtDesc(Long weddingId, Long guestId);
    List<WeddingMessage> findByWeddingIdAndIsBroadcastTrueOrderByCreatedAtDesc(Long weddingId);
}









