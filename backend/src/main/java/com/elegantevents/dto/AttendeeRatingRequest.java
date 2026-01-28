package com.elegantevents.dto;

import com.elegantevents.model.AttendeeRating;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AttendeeRatingRequest {
    private Long weddingId;
    private Long guestId;
    private AttendeeRating.RatedType ratedType; // PROTOCOL, WEDDING, COUPLE
    private String ratedId; // Protocol clerkId, weddingId, or couple clerkId
    private Integer rating; // 1-5
    private String comment;
}









