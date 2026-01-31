package com.elegantevents.service;

import com.elegantevents.model.Message;
import com.elegantevents.model.User;
import com.elegantevents.repository.MessageRepository;
import com.elegantevents.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class MessageService {

    private final MessageRepository messageRepository;
    private final UserRepository userRepository;

    public MessageService(MessageRepository messageRepository, UserRepository userRepository) {
        this.messageRepository = messageRepository;
        this.userRepository = userRepository;
    }

    public Message sendMessage(String senderClerkId, String receiverClerkId, String content) {
        User sender = userRepository.findByClerkId(senderClerkId)
                .orElseThrow(() -> new RuntimeException("Sender not found"));
        User receiver = userRepository.findByClerkId(receiverClerkId)
                .orElseThrow(() -> new RuntimeException("Receiver not found"));

        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(content);
        message.setRead(false);

        return messageRepository.save(message);
    }

    public List<Message> getConversation(String user1ClerkId, String user2ClerkId) {
        User user1 = userRepository.findByClerkId(user1ClerkId)
                .orElseThrow(() -> new RuntimeException("User 1 not found"));
        User user2 = userRepository.findByClerkId(user2ClerkId)
                .orElseThrow(() -> new RuntimeException("User 2 not found"));

        // Mark messages as read when fetching conversation
        // TODO: This marks everything as read, maybe optimize to only mark receiver's messages?
        // For now, simpler is better.
        
        return messageRepository.findConversation(user1.getId(), user2.getId());
    }

    public List<Message> getInbox(String clerkId) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return messageRepository.findLatestConversations(user.getId());
    }
    
    public void markAsRead(Long messageId) {
        messageRepository.findById(messageId).ifPresent(m -> {
            m.setRead(true);
            messageRepository.save(m);
        });
    }
}
