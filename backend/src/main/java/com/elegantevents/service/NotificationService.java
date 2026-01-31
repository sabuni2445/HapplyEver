package com.elegantevents.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class NotificationService {
    
    @Autowired(required = false)
    private JavaMailSender mailSender;
    
    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontendUrl;
    
    @Value("${spring.mail.from:noreply@elegantevents.com}")
    private String fromEmail;
    
    public void sendGuestInvitation(String email, String phoneNumber, String guestName, 
                                   String uniqueCode, String coupleClerkId, String coupleName) {
        String invitationUrl = frontendUrl + "/attendee/dashboard?code=" + uniqueCode + "&couple=" + coupleClerkId;
        
        // Send email if provided
        if (email != null && !email.isEmpty() && mailSender != null) {
            sendEmailInvitation(email, guestName, invitationUrl, uniqueCode, coupleName);
        }
        
        // Send SMS if phone provided (requires SMS service integration like Twilio)
        if (phoneNumber != null && !phoneNumber.isEmpty()) {
            sendSMSInvitation(phoneNumber, guestName, invitationUrl, uniqueCode);
        }
    }

    public void sendMeetingConfirmation(String email, String userName, String meetingTime, 
                                        String purpose, String jitsiLink) {
        if (email != null && !email.isEmpty() && mailSender != null) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
                
                helper.setFrom(fromEmail);
                helper.setTo(email);
                helper.setSubject("Meeting Request Confirmed - Elegant Events");
                
                String htmlContent = buildMeetingEmailTemplate(userName, meetingTime, purpose, jitsiLink);
                helper.setText(htmlContent, true);
                
                mailSender.send(message);
            } catch (MessagingException e) {
                System.err.println("Failed to send meeting email: " + e.getMessage());
                // Fallback
                try {
                    SimpleMailMessage simpleMessage = new SimpleMailMessage();
                    simpleMessage.setFrom(fromEmail);
                    simpleMessage.setTo(email);
                    simpleMessage.setSubject("Meeting Confirmation");
                    simpleMessage.setText("Dear " + userName + ",\n\nYour meeting has been scheduled.\n\n" +
                        "Time: " + meetingTime + "\nPurpose: " + purpose + "\nJoin Meeting: " + jitsiLink);
                    mailSender.send(simpleMessage);
                } catch (Exception ex) {
                    System.err.println("Failed to send simple meeting email: " + ex.getMessage());
                }
            }
        }
    }
    
    private void sendEmailInvitation(String email, String guestName, String invitationUrl, 
                                     String uniqueCode, String coupleName) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setFrom(fromEmail);
            helper.setTo(email);
            helper.setSubject("You're Invited! 🎉 Wedding Invitation from " + coupleName);
            
            String htmlContent = buildEmailTemplate(guestName, invitationUrl, uniqueCode, coupleName);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Failed to send email invitation: " + e.getMessage());
            // Fallback to simple email
            try {
                SimpleMailMessage simpleMessage = new SimpleMailMessage();
                simpleMessage.setFrom(fromEmail);
                simpleMessage.setTo(email);
                simpleMessage.setSubject("Wedding Invitation");
                simpleMessage.setText("Dear " + guestName + ",\n\nYou're invited to our wedding!\n\n" +
                    "Access your invitation: " + invitationUrl + "\n\nYour unique code: " + uniqueCode);
                mailSender.send(simpleMessage);
            } catch (Exception ex) {
                System.err.println("Failed to send simple email: " + ex.getMessage());
            }
        }
    }
    
    private String buildEmailTemplate(String guestName, String invitationUrl, String uniqueCode, String coupleName) {
        return "<!DOCTYPE html>" +
            "<html>" +
            "<head><meta charset='UTF-8'><style>" +
            "body { font-family: 'Playfair Display', serif; background: #fdf6f0; padding: 20px; }" +
            ".container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }" +
            ".header { text-align: center; color: #d4af37; margin-bottom: 30px; }" +
            ".content { color: #523c2b; line-height: 1.8; }" +
            ".button { display: inline-block; padding: 15px 30px; background: #d4af37; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }" +
            ".code { background: #fef3c7; padding: 10px; border-radius: 8px; text-align: center; font-family: monospace; font-size: 18px; color: #92400e; margin: 20px 0; }" +
            ".footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px; }" +
            "</style></head>" +
            "<body>" +
            "<div class='container'>" +
            "<div class='header'><h1>💐 Wedding Invitation</h1></div>" +
            "<div class='content'>" +
            "<p>Dear " + guestName + ",</p>" +
            "<p>We are delighted to invite you to celebrate our special day with us!</p>" +
            "<p>Click the button below to view your personalized wedding invitation and access your entry QR code:</p>" +
            "<div style='text-align: center;'><a href='" + invitationUrl + "' class='button' target='_blank'>View Invitation</a></div>" +
            "<p style='margin-top: 15px; font-size: 0.9em; color: #6b7280;'>Or copy this link: <br/><code style='background: #f3f4f6; padding: 5px 10px; border-radius: 4px; word-break: break-all;'>" + invitationUrl + "</code></p>" +
            "<p>Your unique access code:</p>" +
            "<div class='code'>" + uniqueCode + "</div>" +
            "<p>We look forward to sharing this beautiful day with you!</p>" +
            "<p>With love,<br>" + coupleName + "</p>" +
            "</div>" +
            "<div class='footer'>" +
            "<p>This is an automated invitation. Please save this email for your reference.</p>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>";
    }
    
    private void sendSMSInvitation(String phoneNumber, String guestName, String invitationUrl, String uniqueCode) {
        // TODO: Integrate with SMS service (Twilio, AWS SNS, etc.)
        // For now, just log the SMS content
        String smsMessage = "Dear " + guestName + ", you're invited! View your invitation: " + 
                           invitationUrl + " Code: " + uniqueCode;
        System.out.println("SMS to " + phoneNumber + ": " + smsMessage);
        
        // Example Twilio integration (requires Twilio dependency):
        // Twilio.init(accountSid, authToken);
        // Message message = Message.creator(
        //     new PhoneNumber(phoneNumber),
        //     new PhoneNumber(twilioPhoneNumber),
        //     smsMessage
        // ).create();
    }

    private String buildMeetingEmailTemplate(String userName, String meetingTime, String purpose, String jitsiLink) {
        return "<!DOCTYPE html>" +
            "<html>" +
            "<head><meta charset='UTF-8'><style>" +
            "body { font-family: 'Playfair Display', serif; background: #fdf6f0; padding: 20px; }" +
            ".container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; padding: 30px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }" +
            ".header { text-align: center; color: #d4af37; margin-bottom: 30px; }" +
            ".content { color: #523c2b; line-height: 1.8; }" +
            ".button { display: inline-block; padding: 15px 30px; background: #d4af37; color: white; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 600; }" +
            ".info-box { background: #fdf6f0; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #d4af37; }" +
            ".footer { margin-top: 30px; text-align: center; color: #6b7280; font-size: 14px; }" +
            "</style></head>" +
            "<body>" +
            "<div class='container'>" +
            "<div class='header'><h1>📅 Meeting Confirmation</h1></div>" +
            "<div class='content'>" +
            "<p>Dear " + userName + ",</p>" +
            "<p>Your meeting request with the manager has been received and confirmed.</p>" +
            "<div class='info-box'>" +
            "<p><strong>Time:</strong> " + meetingTime + "</p>" +
            "<p><strong>Purpose:</strong> " + purpose + "</p>" +
            "</div>" +
            "<p>You can join the meeting using Jitsi at the scheduled time by clicking the button below:</p>" +
            "<div style='text-align: center;'><a href='" + jitsiLink + "' class='button' target='_blank'>Join Meeting</a></div>" +
            "<p style='margin-top: 15px; font-size: 0.9em; color: #6b7280;'>Meeting Link: <br/>" + jitsiLink + "</p>" +
            "<p>We look forward to meeting with you!</p>" +
            "<p>Best regards,<br>Elegant Events Team</p>" +
            "</div>" +
            "<div class='footer'>" +
            "<p>This is an automated notification. Please save this meeting link for your reference.</p>" +
            "</div>" +
            "</div>" +
            "</body>" +
            "</html>";
    }
}

