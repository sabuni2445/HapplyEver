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
    public ResponseEntity<Message> sendMessage(@RequestBody Map<String, String> payload) {
        try {
            String senderClerkId = payload.get("senderClerkId");
            String receiverClerkId = payload.get("receiverClerkId");
            String content = payload.get("content");
            
            return ResponseEntity.ok(messageService.sendMessage(senderClerkId, receiverClerkId, content));
        } catch (Exception e) {
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
}
