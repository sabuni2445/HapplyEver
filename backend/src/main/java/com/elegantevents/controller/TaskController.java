package com.elegantevents.controller;

import com.elegantevents.model.Task;
import com.elegantevents.service.TaskService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }
    
    @GetMapping("/test")
    public ResponseEntity<String> test() {
        return ResponseEntity.ok("Task Controller is working");
    }

    @PostMapping("/create")
    public ResponseEntity<Task> createTask(@RequestBody Map<String, Object> request) {
        try {
            Long weddingId = Long.valueOf(request.get("weddingId").toString());
            String title = (String) request.get("title");
            String description = (String) request.get("description");
            String category = (String) request.get("category");
            String assignedRole = (String) request.get("assignedRole");
            
            Long assignedProtocolId = null;
            if (request.get("assignedProtocolId") != null) {
                assignedProtocolId = Long.valueOf(request.get("assignedProtocolId").toString());
            }
            
            LocalDateTime dueDate = null;
            if (request.get("dueDate") != null) {
                String dueDateStr = request.get("dueDate").toString();
                try {
                    // Handle ISO-8601 strings commonly sent by frontend/mobile
                    dueDate = java.time.OffsetDateTime.parse(dueDateStr).toLocalDateTime();
                } catch (Exception e) {
                    try {
                        dueDate = LocalDateTime.parse(dueDateStr);
                    } catch (Exception e2) {
                        System.err.println("Failed to parse task due date: " + dueDateStr);
                    }
                }
            }

            Task task = taskService.createTask(weddingId, title, description, category, assignedRole, assignedProtocolId, dueDate);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            e.printStackTrace(); // Added for better debugging
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/wedding/{weddingId}")
    public ResponseEntity<List<Task>> getTasksByWedding(@PathVariable Long weddingId) {
        try {
            return ResponseEntity.ok(taskService.getTasksByWedding(weddingId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @GetMapping("/protocol/{protocolId}")
    public ResponseEntity<List<Task>> getTasksByProtocol(@PathVariable Long protocolId) {
        try {
            return ResponseEntity.ok(taskService.getTasksByProtocol(protocolId));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }
    
    @PatchMapping("/{taskId}/accept")
    public ResponseEntity<Task> acceptTask(@PathVariable Long taskId) {
        try {
            Task task = taskService.acceptTask(taskId);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PatchMapping("/{taskId}/reject")
    public ResponseEntity<Task> rejectTask(
            @PathVariable Long taskId,
            @RequestBody Map<String, String> payload) {
        try {
            Task task = taskService.rejectTask(taskId, payload.get("reason"));
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
    
    @PatchMapping("/{taskId}/complete")
    public ResponseEntity<Task> completeTask(@PathVariable Long taskId) {
        try {
            Task task = taskService.completeTask(taskId);
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{taskId}/status")
    public ResponseEntity<Task> updateTaskStatus(
            @PathVariable Long taskId,
            @RequestBody Map<String, String> payload) {
        try {
            Task task = taskService.updateTaskStatus(taskId, payload.get("status"));
            return ResponseEntity.ok(task);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{taskId}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long taskId) {
        try {
            taskService.deleteTask(taskId);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }
}
