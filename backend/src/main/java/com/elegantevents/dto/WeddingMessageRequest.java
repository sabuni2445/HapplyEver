package com.elegantevents.dto;

import com.elegantevents.model.WeddingMessage;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class WeddingMessageRequest {
    private Long weddingId;
    private String senderClerkId;
    private WeddingMessage.SenderType senderType;
    private WeddingMessage.RecipientType recipientType;
    private Long recipientGuestId; // Optional, for specific guest
    private String message;
    private Boolean isBroadcast; // For "see you in 10 min" type messages
}









