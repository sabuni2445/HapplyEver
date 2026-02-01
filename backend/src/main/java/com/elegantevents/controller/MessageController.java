package com.elegantevents.controller;

import com.elegantevents.model.Message;
import com.elegantevents.service.MessageService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    private final MessageService messageService;

    public MessageController(MessageService messageService) {
        this.messageService = messageService;
    }

    @PostMapping("/send")
    public ResponseEntity<Message> sendMessage(@RequestBody Map<String, Object> payload) {
        try {
            // Support both senderId/receiverId (numeric) and senderClerkId/receiverClerkId (string)
            String senderClerkId = payload.get("senderClerkId") != null ? 
                payload.get("senderClerkId").toString() : null;
            String receiverClerkId = payload.get("receiverClerkId") != null ? 
                payload.get("receiverClerkId").toString() : null;
            String content = payload.get("content").toString();
            
            // If IDs are provided instead of clerkIds, we need to handle that
            if (senderClerkId == null && payload.get("senderId") != null) {
                // This is a numeric ID, need to convert - for now just return error
                return ResponseEntity.badRequest().body(null);
            }
            
            return ResponseEntity.ok(messageService.sendMessage(senderClerkId, receiverClerkId, content));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().body(null);
        }
    }

    @GetMapping("/conversation")
    public ResponseEntity<List<Message>> getConversation(
            @RequestParam String user1, 
            @RequestParam String user2) {
        return ResponseEntity.ok(messageService.getConversation(user1, user2));
    }

    @GetMapping("/inbox/{clerkId}")
    public ResponseEntity<List<Message>> getInbox(@PathVariable String clerkId) {
        return ResponseEntity.ok(messageService.getInbox(clerkId));
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Message>> getMessagesByUser(@PathVariable Long userId) {
        try {
            return ResponseEntity.ok(messageService.getMessagesByUserId(userId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.ok(List.of());
        }
    }
}
