package com.elegantevents.controller;

import com.elegantevents.model.CoupleFeedback;
import com.elegantevents.service.CoupleFeedbackService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
public class FeedbackController {
    
    private final CoupleFeedbackService feedbackService;
    private final com.elegantevents.repository.TaskRepository taskRepository;
    private final com.elegantevents.repository.CoupleFeedbackRepository feedbackRepository;
    
    public FeedbackController(CoupleFeedbackService feedbackService, 
                              com.elegantevents.repository.TaskRepository taskRepository,
                              com.elegantevents.repository.CoupleFeedbackRepository feedbackRepository) {
        this.feedbackService = feedbackService;
        this.taskRepository = taskRepository;
        this.feedbackRepository = feedbackRepository;
    }
    
    @PostMapping("/submit")
    public ResponseEntity<Map<String, Object>> submitFeedback(@RequestBody Map<String, Object> request) {
        try {
            List<Map<String, Object>> feedbacksRaw = (List<Map<String, Object>>) request.get("feedbacks");
            List<CoupleFeedback> submitted = feedbackService.submitFeedbacks(feedbacksRaw);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("count", submitted.size());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> error = new HashMap<>();
            error.put("success", false);
            error.put("error", e.getMessage());
            return ResponseEntity.badRequest().body(error);
        }
    }
    
    @GetMapping("/wedding/{weddingId}")
    public ResponseEntity<List<CoupleFeedback>> getWeddingFeedback(@PathVariable Long weddingId) {
        return ResponseEntity.ok(feedbackService.getFeedbacksByWedding(weddingId));
    }

    @GetMapping("/protocol/{clerkId}/stats")
    public ResponseEntity<Map<String, Object>> getProtocolStats(@PathVariable String clerkId) {
        try {
            // Get all tasks for this protocol
            // We need protocol's numeric ID for TaskRepository... 
            // BUT wait, TaskRepository findByAssignedProtocolId takes a Long.
            // We need to resolve the Clerk ID to Long ID first.
            // I'll skip the numeric ID check for now and assume the caller provides it or I find it.
            // Let's assume we use Clerk ID for everything soon, but for now...
            
            List<com.elegantevents.model.Task> tasks = taskRepository.findAll(); // Heavy, but works for now. Better: add findByAssignedProtocolClerkId
            long totalTasks = tasks.stream().filter(t -> t.getAssignedProtocol() != null && t.getAssignedProtocol().getClerkId().equals(clerkId)).count();
            long rejectedTasks = tasks.stream().filter(t -> t.getAssignedProtocol() != null && t.getAssignedProtocol().getClerkId().equals(clerkId) && t.getStatus() == com.elegantevents.model.Task.TaskStatus.REJECTED).count();
            long completedTasks = tasks.stream().filter(t -> t.getAssignedProtocol() != null && t.getAssignedProtocol().getClerkId().equals(clerkId) && t.getStatus() == com.elegantevents.model.Task.TaskStatus.COMPLETED).count();

            // Ratings
            List<CoupleFeedback> ratings = feedbackRepository.findByTargetId(clerkId);
            double avgRating = ratings.stream().mapToInt(CoupleFeedback::getRating).average().orElse(0.0);
            
            Map<String, Object> stats = new HashMap<>();
            stats.put("totalTasks", totalTasks);
            stats.put("rejectedTasks", rejectedTasks);
            stats.put("completedTasks", completedTasks);
            stats.put("averageRating", Math.round(avgRating * 10) / 10.0);
            stats.put("reviewCount", ratings.size());
            
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.internalServerError().build();
        }
    }
}
