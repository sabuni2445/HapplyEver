package com.elegantevents.service;

import com.elegantevents.dto.GuestRequest;
import com.elegantevents.model.Guest;
import com.elegantevents.model.User;
import com.elegantevents.model.Wedding;
import com.elegantevents.model.WeddingCard;
import com.elegantevents.repository.GuestRepository;
import com.elegantevents.repository.UserRepository;
import com.elegantevents.repository.WeddingRepository;
import com.elegantevents.repository.WeddingCardRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.security.SecureRandom;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@Transactional
public class GuestService {
    
    private final GuestRepository guestRepository;
    private final WeddingRepository weddingRepository;
    private final UserRepository userRepository;
    private final WeddingCardRepository weddingCardRepository;
    private final QRCodeService qrCodeService;
    private final NotificationService notificationService;
    private static final String CHARACTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    private static final int CODE_LENGTH = 8;
    private final SecureRandom random = new SecureRandom();
    
    public GuestService(GuestRepository guestRepository,
                       WeddingRepository weddingRepository,
                       UserRepository userRepository,
                       WeddingCardRepository weddingCardRepository,
                       QRCodeService qrCodeService,
                       NotificationService notificationService) {
        this.guestRepository = guestRepository;
        this.weddingRepository = weddingRepository;
        this.userRepository = userRepository;
        this.weddingCardRepository = weddingCardRepository;
        this.qrCodeService = qrCodeService;
        this.notificationService = notificationService;
    }
    
    public List<Guest> createGuests(String coupleClerkId, GuestRequest request) {
        Wedding wedding = weddingRepository.findByClerkId(coupleClerkId)
                .orElseThrow(() -> new RuntimeException("Wedding not found"));
        
        return request.getGuests().stream()
                .map(guestData -> {
                    Guest guest = new Guest();
                    guest.setWeddingId(wedding.getId());
                    guest.setCoupleClerkId(coupleClerkId);
                    guest.setFirstName(guestData.getFirstName());
                    guest.setLastName(guestData.getLastName());
                    guest.setPhoneNumber(guestData.getPhoneNumber());
                    guest.setEmail(guestData.getEmail());
                    // Set priority and seat number if provided
                    if (guestData.getPriority() != null) {
                        guest.setPriority(guestData.getPriority());
                    }
                    if (guestData.getSeatNumber() != null && !guestData.getSeatNumber().isEmpty()) {
                        guest.setSeatNumber(guestData.getSeatNumber());
                    }
                    
                    // Generate unique code
                    String uniqueCode = generateUniqueCode();
                    guest.setUniqueCode(uniqueCode);
                    
                    // Generate QR code
                    String qrCodeUrl = qrCodeService.generateQRCode(uniqueCode, coupleClerkId);
                    guest.setQrCodeUrl(qrCodeUrl);
                    
                    Guest savedGuest = guestRepository.save(guest);
                    
                    // Create attendee user if email or phone is provided
                    createAttendeeUser(guestData, uniqueCode);
                    
                    // Send invitation notification
                    try {
                        User couple = userRepository.findByClerkId(coupleClerkId).orElse(null);
                        String coupleName = couple != null ? 
                            (couple.getFirstName() + " " + (couple.getLastName() != null ? couple.getLastName() : "")).trim() 
                            : "The Couple";
                        notificationService.sendGuestInvitation(
                            guestData.getEmail(),
                            guestData.getPhoneNumber(),
                            guestData.getFirstName() + " " + (guestData.getLastName() != null ? guestData.getLastName() : ""),
                            uniqueCode,
                            coupleClerkId,
                            coupleName
                        );
                        savedGuest.setInvitationSent(true);
                        guestRepository.save(savedGuest);
                    } catch (Exception e) {
                        System.err.println("Failed to send invitation notification: " + e.getMessage());
                    }
                    
                    return savedGuest;
                })
                .toList();
    }
    
    private void createAttendeeUser(GuestRequest.GuestData guestData, String uniqueCode) {
        String email = guestData.getEmail();
        String phone = guestData.getPhoneNumber();
        
        // Create attendee user if email is provided
        if (email != null && !email.isEmpty()) {
            // Check if user already exists
            if (userRepository.findByEmail(email).isEmpty()) {
                User attendee = new User();
                // Generate a unique clerkId for attendee (since they don't have Clerk account)
                // Use uniqueCode as part of the ID to ensure uniqueness
                attendee.setClerkId("attendee_" + uniqueCode + "_" + UUID.randomUUID().toString().substring(0, 8));
                attendee.setEmail(email);
                attendee.setFirstName(guestData.getFirstName());
                attendee.setLastName(guestData.getLastName());
                if (phone != null && !phone.isEmpty()) {
                    attendee.setPhoneNumber(phone);
                }
                attendee.setSelectedRole(User.UserRole.ATTENDEE);
                attendee.setProfileCompleted(true);
                userRepository.save(attendee);
            }
        } else if (phone != null && !phone.isEmpty()) {
            // If only phone is provided, create user with phone-based identifier
            // Note: We can't use phone as unique identifier easily, so we'll use the uniqueCode
            User attendee = new User();
            attendee.setClerkId("attendee_" + uniqueCode + "_" + UUID.randomUUID().toString().substring(0, 8));
            attendee.setFirstName(guestData.getFirstName());
            attendee.setLastName(guestData.getLastName());
            attendee.setPhoneNumber(phone);
            attendee.setSelectedRole(User.UserRole.ATTENDEE);
            attendee.setProfileCompleted(true);
            userRepository.save(attendee);
        }
    }
    
    private String generateUniqueCode() {
        String code;
        do {
            StringBuilder sb = new StringBuilder(CODE_LENGTH);
            for (int i = 0; i < CODE_LENGTH; i++) {
                sb.append(CHARACTERS.charAt(random.nextInt(CHARACTERS.length())));
            }
            code = sb.toString();
        } while (guestRepository.existsByUniqueCode(code));
        
        return code;
    }
    
    @Transactional(readOnly = true)
    public List<Guest> getGuestsByCouple(String coupleClerkId) {
        return guestRepository.findByCoupleClerkId(coupleClerkId);
    }
    
    @Transactional(readOnly = true)
    public List<Guest> getGuestsByWedding(Long weddingId) {
        return guestRepository.findByWeddingId(weddingId);
    }
    
    @Transactional(readOnly = true)
    public Guest getGuestByUniqueCode(String uniqueCode) {
        return guestRepository.findByUniqueCode(uniqueCode)
                .orElseThrow(() -> new RuntimeException("Guest not found"));
    }

    @Transactional
    public Guest checkInGuest(Long guestId) {
        Guest guest = guestRepository.findById(guestId)
                .orElseThrow(() -> new RuntimeException("Guest not found"));
        guest.setCheckedIn(true);
        guest.setCheckedInAt(LocalDateTime.now());
        return guestRepository.save(guest);
    }
}

