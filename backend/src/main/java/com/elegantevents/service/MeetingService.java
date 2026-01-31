package com.elegantevents.service;

import com.elegantevents.model.MeetingRequest;
import com.elegantevents.model.User;
import com.elegantevents.repository.MeetingRequestRepository;
import com.elegantevents.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

@Service
@Transactional
public class MeetingService {

    private final MeetingRequestRepository meetingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public MeetingService(MeetingRequestRepository meetingRepository, 
                          UserRepository userRepository,
                          NotificationService notificationService) {
        this.meetingRepository = meetingRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    public MeetingRequest requestMeeting(Long coupleId, String meetingTimeStr, String purpose) {
        User couple = userRepository.findById(coupleId)
                .orElseThrow(() -> new RuntimeException("Couple not found with id: " + coupleId));

        // Find a manager to assign (for now, assign the first available manager)
        User manager = userRepository.findBySelectedRole(User.UserRole.MANAGER)
                .stream().findFirst().orElse(null);

        MeetingRequest meeting = new MeetingRequest();
        meeting.setCouple(couple);
        meeting.setManager(manager);
        meeting.setMeetingTime(java.time.LocalDateTime.parse(meetingTimeStr));
        meeting.setPurpose(purpose);
        meeting.setStatus(MeetingRequest.MeetingStatus.APPROVED); // Automatically approve for now per user request

        // Generate Jitsi link
        String roomName = "ElegantEvents-Meeting-" + UUID.randomUUID().toString().substring(0, 8);
        String jitsiLink = "https://meet.jit.si/" + roomName;
        meeting.setJitsiLink(jitsiLink);

        MeetingRequest savedMeeting = meetingRepository.save(meeting);

        // Send Email Notifications
        String formattedTime = meeting.getMeetingTime().format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a"));
        
        // Notify Couple
        notificationService.sendMeetingConfirmation(
                couple.getEmail(), 
                couple.getFirstName(), 
                formattedTime, 
                purpose, 
                jitsiLink
        );

        // Notify Manager if assigned
        if (manager != null && manager.getEmail() != null) {
            notificationService.sendMeetingConfirmation(
                    manager.getEmail(),
                    manager.getFirstName(),
                    formattedTime,
                    "Client Meeting: " + couple.getFirstName() + " - " + purpose,
                    jitsiLink
            );
        }

        return savedMeeting;
    }

    public MeetingRequest requestMeetingByManager(String managerClerkId, Long coupleId, String meetingTimeStr, String purpose) {
        User manager = userRepository.findByClerkId(managerClerkId)
                .orElseThrow(() -> new RuntimeException("Manager not found"));
        User couple = userRepository.findById(coupleId)
                .orElseThrow(() -> new RuntimeException("Couple not found"));

        MeetingRequest meeting = new MeetingRequest();
        meeting.setCouple(couple);
        meeting.setManager(manager);
        meeting.setMeetingTime(java.time.LocalDateTime.parse(meetingTimeStr));
        meeting.setPurpose(purpose);
        meeting.setStatus(MeetingRequest.MeetingStatus.PENDING);
        meeting.setInitiator("MANAGER");

        // Generate Jitsi link
        String roomName = "ElegantEvents-Meeting-" + UUID.randomUUID().toString().substring(0, 8);
        String jitsiLink = "https://meet.jit.si/" + roomName;
        meeting.setJitsiLink(jitsiLink);

        MeetingRequest savedMeeting = meetingRepository.save(meeting);

        // Notify Couple
        String formattedTime = meeting.getMeetingTime().format(DateTimeFormatter.ofPattern("MMM dd, yyyy 'at' hh:mm a"));
        notificationService.sendMeetingConfirmation(
                couple.getEmail(),
                couple.getFirstName(),
                formattedTime,
                "Request from Manager: " + purpose,
                jitsiLink
        );

        return savedMeeting;
    }

    public MeetingRequest respondToMeeting(Long meetingId, String status, String reason) {
        MeetingRequest meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new RuntimeException("Meeting not found"));

        if ("APPROVED".equalsIgnoreCase(status)) {
            meeting.setStatus(MeetingRequest.MeetingStatus.APPROVED);
        } else if ("REJECTED".equalsIgnoreCase(status)) {
            meeting.setStatus(MeetingRequest.MeetingStatus.REJECTED);
            meeting.setRejectionReason(reason);
        }

        return meetingRepository.save(meeting);
    }

    public List<MeetingRequest> getMeetingsByCouple(Long coupleId) {
        User couple = userRepository.findById(coupleId).orElse(null);
        if (couple == null) return List.of();
        return meetingRepository.findByCouple(couple);
    }

    public List<MeetingRequest> getMeetingsByManager(Long managerId) {
        User manager = userRepository.findById(managerId).orElse(null);
        if (manager == null) return List.of();
        return meetingRepository.findByManager(manager);
    }
}
