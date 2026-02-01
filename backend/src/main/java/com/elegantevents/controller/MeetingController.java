package com.elegantevents.controller;

import com.elegantevents.dto.MeetingRequestDTO;
import com.elegantevents.model.MeetingRequest;
import com.elegantevents.service.MeetingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/meetings")
public class MeetingController {

    private final MeetingService meetingService;

    public MeetingController(MeetingService meetingService) {
        this.meetingService = meetingService;
    }

    @PostMapping("/request")
    public ResponseEntity<MeetingRequest> requestMeeting(@RequestBody MeetingRequestDTO request) {
        try {
            MeetingRequest meeting = meetingService.requestMeeting(
                    request.getCoupleId(), 
                    request.getMeetingTime(), 
                    request.getPurpose()
            );
            return ResponseEntity.ok(meeting);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PostMapping("/manager-request")
    public ResponseEntity<MeetingRequest> requestMeetingByManager(@RequestBody Map<String, Object> request) {
        try {
            String managerClerkId = (String) request.get("managerClerkId");
            Long coupleId = Long.valueOf(request.get("coupleId").toString());
            String meetingTime = (String) request.get("meetingTime");
            String purpose = (String) request.get("purpose");
            
            MeetingRequest meeting = meetingService.requestMeetingByManager(
                    managerClerkId,
                    coupleId,
                    meetingTime,
                    purpose
            );
            return ResponseEntity.ok(meeting);
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/respond")
    public ResponseEntity<MeetingRequest> respondToMeeting(
            @PathVariable Long id, 
            @RequestBody Map<String, String> payload) {
        try {
            return ResponseEntity.ok(meetingService.respondToMeeting(id, payload.get("status"), payload.get("reason")));
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/couple/{coupleId}")
    public ResponseEntity<List<MeetingRequest>> getCoupleMeetings(@PathVariable Long coupleId) {
        return ResponseEntity.ok(meetingService.getMeetingsByCouple(coupleId));
    }

    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<MeetingRequest>> getManagerMeetings(@PathVariable Long managerId) {
        return ResponseEntity.ok(meetingService.getMeetingsByManager(managerId));
    }
}
