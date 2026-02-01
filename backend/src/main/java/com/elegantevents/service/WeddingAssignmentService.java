package com.elegantevents.service;

import com.elegantevents.model.User;
import com.elegantevents.model.Wedding;
import com.elegantevents.model.WeddingAssignment;
import com.elegantevents.repository.WeddingAssignmentRepository;
import com.elegantevents.repository.WeddingRepository;
import com.elegantevents.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class WeddingAssignmentService {
    
    private final WeddingAssignmentRepository assignmentRepository;
    private final WeddingRepository weddingRepository;
    private final UserRepository userRepository;
    
    public WeddingAssignmentService(WeddingAssignmentRepository assignmentRepository,
                                   WeddingRepository weddingRepository,
                                   UserRepository userRepository) {
        this.assignmentRepository = assignmentRepository;
        this.weddingRepository = weddingRepository;
        this.userRepository = userRepository;
    }
    
    public WeddingAssignment assignWeddingToManager(Long weddingId, String managerClerkId, String adminClerkId) {
        // Verify admin
        User admin = userRepository.findByClerkId(adminClerkId)
                .orElseThrow(() -> new RuntimeException("Admin not found"));
        if (admin.getSelectedRole() != User.UserRole.ADMIN) {
            throw new RuntimeException("Only admins can assign weddings");
        }
        
        // Verify manager
        User manager = userRepository.findByClerkId(managerClerkId)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        if (manager.getSelectedRole() != User.UserRole.MANAGER) {
            throw new RuntimeException("User must be a manager");
        }
        
        Wedding wedding = weddingRepository.findById(weddingId)
                .orElseThrow(() -> new RuntimeException("Wedding not found"));
        
        Optional<WeddingAssignment> existing = assignmentRepository.findByWeddingId(weddingId);
        WeddingAssignment assignment;
        
        if (existing.isPresent()) {
            assignment = existing.get();
        } else {
            assignment = new WeddingAssignment();
            assignment.setWeddingId(weddingId);
            assignment.setCoupleClerkId(wedding.getClerkId());
        }
        
        assignment.setManagerClerkId(managerClerkId);
        assignment.setStatus(WeddingAssignment.AssignmentStatus.ASSIGNED_TO_MANAGER);
        
        return assignmentRepository.save(assignment);
    }
    
    public WeddingAssignment assignProtocolToWedding(Long weddingId, String protocolClerkId, String managerClerkId, String protocolJob) {
        // Verify manager
        User manager = userRepository.findByClerkId(managerClerkId)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        if (manager.getSelectedRole() != User.UserRole.MANAGER) {
            throw new RuntimeException("Only managers can assign protocols");
        }
        
        // Verify protocol
        User protocol = userRepository.findByClerkId(protocolClerkId)
                .orElseThrow(() -> new RuntimeException("Protocol not found"));
        if (protocol.getSelectedRole() != User.UserRole.PROTOCOL) {
            throw new RuntimeException("User must be a protocol officer");
        }
        
        WeddingAssignment assignment = assignmentRepository.findByWeddingId(weddingId)
                .orElseThrow(() -> new RuntimeException("Wedding assignment not found"));
        
        if (!assignment.getManagerClerkId().equals(managerClerkId)) {
            throw new RuntimeException("You are not assigned to manage this wedding");
        }
        
        assignment.setProtocolClerkId(protocolClerkId);
        assignment.setProtocolJob(protocolJob);
        assignment.setStatus(WeddingAssignment.AssignmentStatus.ASSIGNED_TO_PROTOCOL);
        
        return assignmentRepository.save(assignment);
    }
    
    @Transactional(readOnly = true)
    public List<WeddingAssignment> getAllAssignments() {
        return assignmentRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public List<WeddingAssignment> getAssignmentsByManager(String managerClerkId) {
        return assignmentRepository.findByManagerClerkId(managerClerkId);
    }
    
    @Transactional(readOnly = true)
    public List<WeddingAssignment> getAssignmentsByProtocol(String protocolClerkId) {
        return assignmentRepository.findByProtocolClerkId(protocolClerkId);
    }
    
    @Transactional(readOnly = true)
    public WeddingAssignment getAssignmentByWedding(Long weddingId) {
        return assignmentRepository.findByWeddingId(weddingId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));
    }

    public WeddingAssignment completeWedding(Long weddingId, String managerClerkId, Integer rating, String feedback) {
        WeddingAssignment assignment = assignmentRepository.findByWeddingId(weddingId)
                .orElseThrow(() -> new RuntimeException("Assignment not found"));

        if (!assignment.getManagerClerkId().equals(managerClerkId)) {
            throw new RuntimeException("You are not authorized to complete this wedding");
        }

        assignment.setStatus(WeddingAssignment.AssignmentStatus.COMPLETED);
        assignment.setProtocolRating(rating);
        assignment.setProtocolFeedback(feedback);

        // Also update the wedding status if needed
        Wedding wedding = weddingRepository.findById(weddingId)
                .orElseThrow(() -> new RuntimeException("Wedding not found"));
        // Assuming Wedding has a status field, though not explicitly seen yet in model.
        // If not, we still completed the assignment which is used for history.

        return assignmentRepository.save(assignment);
    }

    @Transactional(readOnly = true)
    public WeddingAssignment getAssignmentByCouple(String coupleClerkId) {
        return assignmentRepository.findByCoupleClerkId(coupleClerkId)
                .orElseThrow(() -> new RuntimeException("Assignment not found for couple"));
    }
}









