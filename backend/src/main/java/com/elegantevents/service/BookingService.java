package com.elegantevents.service;

import com.elegantevents.dto.BookingRequest;
import com.elegantevents.model.Booking;
import com.elegantevents.model.User;
import com.elegantevents.repository.BookingRepository;
import com.elegantevents.repository.ServiceRepository;
import com.elegantevents.repository.UserRepository;
import com.elegantevents.repository.WeddingRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class BookingService {
    
    private final BookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    private final WeddingRepository weddingRepository;
    
    public BookingService(BookingRepository bookingRepository, 
                         ServiceRepository serviceRepository,
                         UserRepository userRepository,
                         WeddingRepository weddingRepository) {
        this.bookingRepository = bookingRepository;
        this.serviceRepository = serviceRepository;
        this.userRepository = userRepository;
        this.weddingRepository = weddingRepository;
    }
    
    public Booking createBooking(String coupleClerkId, BookingRequest request) {
        // Get service to find vendor
        com.elegantevents.model.Service service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new RuntimeException("Service not found"));
        
        // Verify couple exists
        userRepository.findByClerkId(coupleClerkId)
                .orElseThrow(() -> new RuntimeException("Couple not found"));
        
        Booking booking = new Booking();
        booking.setServiceId(request.getServiceId());
        booking.setVendorClerkId(service.getClerkId());
        booking.setCoupleClerkId(coupleClerkId);
        booking.setStatus(Booking.BookingStatus.PENDING);
        booking.setEventDate(request.getEventDate());
        booking.setEventTime(request.getEventTime());
        booking.setLocation(request.getLocation());
        booking.setSpecialRequests(request.getSpecialRequests());
        
        return bookingRepository.save(booking);
    }
    
    @Transactional(readOnly = true)
    public List<Booking> getBookingsByCouple(String coupleClerkId) {
        return bookingRepository.findByCoupleClerkId(coupleClerkId);
    }
    
    @Transactional(readOnly = true)
    public List<Booking> getBookingsByVendor(String vendorClerkId) {
        return bookingRepository.findByVendorClerkId(vendorClerkId);
    }
    
    public Booking updateBookingStatus(Long bookingId, String vendorClerkId, Booking.BookingStatus status) {
        Booking booking = bookingRepository.findByIdAndVendorClerkId(bookingId, vendorClerkId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        booking.setStatus(status);
        Booking savedBooking = bookingRepository.save(booking);
        
        // Update service availability status based on booking status
        if (status == Booking.BookingStatus.ACCEPTED) {
            com.elegantevents.model.Service service = serviceRepository.findById(savedBooking.getServiceId())
                    .orElse(null);
            if (service != null) {
                service.setAvailabilityStatus(com.elegantevents.model.Service.AvailabilityStatus.BOOKED);
                serviceRepository.save(service);
                
                // Update wedding details with the accepted service
                updateWeddingWithService(savedBooking, service);
            }
        } else if (status == Booking.BookingStatus.REJECTED || status == Booking.BookingStatus.CANCELLED) {
            // Check if there are other accepted bookings for this service
            List<Booking> acceptedBookings = bookingRepository.findByServiceId(savedBooking.getServiceId())
                    .stream()
                    .filter(b -> b.getStatus() == Booking.BookingStatus.ACCEPTED)
                    .collect(Collectors.toList());
            
            com.elegantevents.model.Service service = serviceRepository.findById(savedBooking.getServiceId())
                    .orElse(null);
            if (service != null && acceptedBookings.isEmpty()) {
                service.setAvailabilityStatus(com.elegantevents.model.Service.AvailabilityStatus.AVAILABLE);
                serviceRepository.save(service);
            }
        }
        
        return savedBooking;
    }
    
    @Transactional(readOnly = true)
    public Booking getBookingById(Long bookingId, String clerkId) {
        // Check if user is couple or vendor
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        
        if (!booking.getCoupleClerkId().equals(clerkId) && !booking.getVendorClerkId().equals(clerkId)) {
            throw new RuntimeException("Unauthorized access to booking");
        }
        
        return booking;
    }
    
    private void updateWeddingWithService(Booking booking, com.elegantevents.model.Service service) {
        Optional<com.elegantevents.model.Wedding> weddingOpt = weddingRepository.findByClerkId(booking.getCoupleClerkId());
        if (weddingOpt.isPresent()) {
            com.elegantevents.model.Wedding wedding = weddingOpt.get();
            String category = service.getCategory();
            
            // Update wedding details based on service category
            if (category != null) {
                switch (category.toUpperCase()) {
                    case "MUSIC":
                        wedding.setMusic(service.getServiceName());
                        break;
                    case "CATERING":
                        wedding.setCatering(service.getServiceName());
                        break;
                    case "PHOTOGRAPHY":
                        wedding.setPhotography(service.getServiceName());
                        break;
                    case "DECORATION":
                    case "DECORATIONS":
                        wedding.setDecorations(service.getServiceName());
                        break;
                    case "VENUE":
                        wedding.setVenue(service.getServiceName());
                        break;
                }
                weddingRepository.save(wedding);
            }
        }
    }
}

