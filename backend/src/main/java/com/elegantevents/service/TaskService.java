package com.elegantevents.service;

import com.elegantevents.model.Task;
import com.elegantevents.model.User;
import com.elegantevents.model.Wedding;
import com.elegantevents.repository.TaskRepository;
import com.elegantevents.repository.UserRepository;
import com.elegantevents.repository.WeddingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class TaskService {

    private final TaskRepository taskRepository;
    private final WeddingRepository weddingRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, WeddingRepository weddingRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.weddingRepository = weddingRepository;
        this.userRepository = userRepository;
    }

    public Task createTask(Long weddingId, String title, String description, String category, String assignedRole, Long assignedProtocolId, LocalDateTime dueDate) {
        Wedding wedding = weddingRepository.findById(weddingId)
                .orElseThrow(() -> new RuntimeException("Wedding not found"));

        Task task = new Task();
        task.setWedding(wedding);
        task.setTitle(title);
        task.setDescription(description);
        task.setAssignedRole(assignedRole);
        task.setDueDate(dueDate);
        
        // Assign to specific protocol if provided
        if (assignedProtocolId != null) {
            User protocol = userRepository.findById(assignedProtocolId)
                    .orElseThrow(() -> new RuntimeException("Protocol not found"));
            task.setAssignedProtocol(protocol);
            task.setStatus(Task.TaskStatus.PENDING_ACCEPTANCE);
        } else {
            task.setStatus(Task.TaskStatus.ACCEPTED); // No protocol, auto-accept
        }
        
        if (category != null) {
            try {
                task.setCategory(Task.TaskCategory.valueOf(category.toUpperCase()));
            } catch (IllegalArgumentException e) {
                task.setCategory(Task.TaskCategory.GENERAL);
            }
        }

        return taskRepository.save(task);
    }

    public List<Task> getTasksByWedding(Long weddingId) {
        return taskRepository.findByWeddingId(weddingId);
    }
    
    public List<Task> getTasksByProtocol(Long protocolId) {
        return taskRepository.findByAssignedProtocolId(protocolId);
    }

    public Task updateTaskStatus(Long taskId, String status) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        
        try {
            task.setStatus(Task.TaskStatus.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid status");
        }
        
        return taskRepository.save(task);
    }
    
    public Task acceptTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setStatus(Task.TaskStatus.ACCEPTED);
        task.setRejectionReason(null);
        return taskRepository.save(task);
    }
    
    public Task rejectTask(Long taskId, String reason) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setStatus(Task.TaskStatus.REJECTED);
        task.setRejectionReason(reason);
        return taskRepository.save(task);
    }
    
    public Task completeTask(Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new RuntimeException("Task not found"));
        task.setStatus(Task.TaskStatus.COMPLETED);
        return taskRepository.save(task);
    }
    
    public void deleteTask(Long taskId) {
        taskRepository.deleteById(taskId);
    }
}
