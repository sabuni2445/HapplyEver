package com.elegantevents.dto;

import lombok.Data;

@Data
public class RatingRequest {
    private Long serviceId;
    private Long bookingId;
    private Integer rating; // 1-5
    private String comment;
}









