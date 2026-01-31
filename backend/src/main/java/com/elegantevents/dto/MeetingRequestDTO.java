package com.elegantevents.dto;

import lombok.Data;

@Data
public class MeetingRequestDTO {
    private Long coupleId;
    private String meetingTime;
    private String purpose;
}
