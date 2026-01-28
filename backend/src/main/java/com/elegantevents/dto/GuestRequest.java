package com.elegantevents.dto;

import com.elegantevents.model.Guest;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GuestRequest {
    private List<GuestData> guests;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GuestData {
        private String firstName;
        private String lastName;
        private String phoneNumber;
        private String email;
        private Guest.Priority priority; // Optional: STANDARD, VIP, VVIP
        private String seatNumber; // Optional seat assignment
    }
}

