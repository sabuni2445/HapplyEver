package com.elegantevents.controller;

import com.elegantevents.dto.WeddingMessageRequest;
import com.elegantevents.model.WeddingMessage;
import com.elegantevents.service.WeddingMessageService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/wedding-messages")
@CrossOrigin(origins = "${app.frontend.url:http://localhost:5173}")
public class WeddingMessageController {
    
    private final WeddingMessageService messageService;
    
    public WeddingMessageController(WeddingMessageService messageService) {
        this.messageService = messageService;
    }
    
    @PostMapping("/send")
    public ResponseEntity<Map<String, Object>> sendMessage(@RequestBody WeddingMessageRequest request) {
        try {
            WeddingMessage message = messageService.sendMessage(request);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", message);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @GetMapping("/wedding/{weddingId}")
    public ResponseEntity<List<WeddingMessage>> getMessagesByWedding(@PathVariable Long weddingId) {
        return ResponseEntity.ok(messageService.getMessagesByWedding(weddingId));
    }
    
    @GetMapping("/wedding/{weddingId}/guest/{guestId}")
    public ResponseEntity<List<WeddingMessage>> getMessagesForGuest(
            @PathVariable Long weddingId,
            @PathVariable Long guestId) {
        return ResponseEntity.ok(messageService.getMessagesForGuest(weddingId, guestId));
    }
}









