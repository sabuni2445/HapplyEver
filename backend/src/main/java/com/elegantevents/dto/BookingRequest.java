package com.elegantevents.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class BookingRequest {
    private Long serviceId;
    private LocalDate eventDate;
    private LocalTime eventTime;
    private String location;
    private String specialRequests;
}









