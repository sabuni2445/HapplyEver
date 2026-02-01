package com.elegantevents.repository;

import com.elegantevents.model.MeetingRequest;
import com.elegantevents.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MeetingRequestRepository extends JpaRepository<MeetingRequest, Long> {
    List<MeetingRequest> findByCouple(User couple);
    List<MeetingRequest> findByManager(User manager);
}
