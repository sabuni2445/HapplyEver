package com.elegantevents.repository;

import com.elegantevents.model.Task;
import com.elegantevents.model.User;
import com.elegantevents.model.Wedding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByWedding(Wedding wedding);
    List<Task> findByWeddingId(Long weddingId);
    List<Task> findByAssignedRole(String assignedRole);
    List<Task> findByAssignedProtocol(User protocol);
    List<Task> findByAssignedProtocolId(Long protocolId);
}
