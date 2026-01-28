package com.elegantevents.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class WeddingRequest {
    private String partnersName;
    private LocalDate weddingDate;
    private LocalTime weddingTime;
    private String location;
    private String venue;
    private Double budget;
    private Integer numberOfGuests;
    private String theme;
    private String catering;
    private String decorations;
    private String music;
    private String photography;
    private String rules;
    private String additionalNotes;
}









