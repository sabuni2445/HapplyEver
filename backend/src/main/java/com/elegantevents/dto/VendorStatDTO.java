package com.elegantevents.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class VendorStatDTO {
    private String name;
    private String service;
    private double revenue;
    private double rating;
    private long bookings;
}
