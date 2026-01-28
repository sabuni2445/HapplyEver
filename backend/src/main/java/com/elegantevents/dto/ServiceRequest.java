package com.elegantevents.dto;

import lombok.Data;

@Data
public class ServiceRequest {
    private String serviceName;
    private String status;
    private String category;
    private String description;
    private Double price;
    private String amount;
    private String duration;
    private String location;
    private String availability;
    private String availabilityStatus;
    private String imageUrl;
    private String videoUrl;
}

