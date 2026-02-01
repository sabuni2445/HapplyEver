package com.elegantevents.dto;

import com.elegantevents.model.Booking;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BookingDTO {
    private Long id;
    private Long serviceId;
    private String serviceName;
    private Double servicePrice;
    private String serviceDescription;
    private String serviceImageUrl;
    private String vendorClerkId;
    private String coupleClerkId;
    private String coupleName;
    private Booking.BookingStatus status;
    private LocalDate eventDate;
    private LocalTime eventTime;
    private String location;
    private String specialRequests;
}
