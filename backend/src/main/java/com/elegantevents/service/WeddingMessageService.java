package com.elegantevents.service;

import com.elegantevents.dto.WeddingMessageRequest;
import com.elegantevents.model.WeddingMessage;
import com.elegantevents.repository.WeddingMessageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class WeddingMessageService {
    
    private final WeddingMessageRepository messageRepository;
    
    public WeddingMessageService(WeddingMessageRepository messageRepository) {
        this.messageRepository = messageRepository;
    }
    
    public WeddingMessage sendMessage(WeddingMessageRequest request) {
        WeddingMessage message = new WeddingMessage();
        message.setWeddingId(request.getWeddingId());
        message.setSenderClerkId(request.getSenderClerkId());
        message.setSenderType(request.getSenderType());
        message.setRecipientType(request.getRecipientType());
        message.setRecipientGuestId(request.getRecipientGuestId());
        message.setMessage(request.getMessage());
        message.setIsBroadcast(request.getIsBroadcast() != null ? request.getIsBroadcast() : false);
        
        return messageRepository.save(message);
    }
    
    @Transactional(readOnly = true)
    public List<WeddingMessage> getMessagesByWedding(Long weddingId) {
        return messageRepository.findByWeddingIdOrderByCreatedAtDesc(weddingId);
    }
    
    @Transactional(readOnly = true)
    public List<WeddingMessage> getMessagesForGuest(Long weddingId, Long guestId) {
        // Get broadcast messages and messages specific to this guest
        List<WeddingMessage> broadcasts = messageRepository.findByWeddingIdAndIsBroadcastTrueOrderByCreatedAtDesc(weddingId);
        List<WeddingMessage> specific = messageRepository.findByWeddingIdAndRecipientGuestIdOrderByCreatedAtDesc(weddingId, guestId);
        
        // Combine both lists
        broadcasts.addAll(specific);
        // Sort by created date descending
        broadcasts.sort((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()));
        return broadcasts;
    }
}

