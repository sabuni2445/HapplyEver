package com.elegantevents.controller;

import com.elegantevents.dto.AIImageRequest;
import com.elegantevents.dto.AIImageResponse;
import com.elegantevents.service.AIService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private AIService aiService;

    @PostMapping("/generate-image")
    public ResponseEntity<AIImageResponse> generateImage(@RequestBody AIImageRequest request) {
        try {
            AIImageResponse response = aiService.generateImage(request.getPrompt());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
