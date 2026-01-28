package com.elegantevents.controller;

import com.elegantevents.dto.BookingRequest;
import com.elegantevents.model.Booking;
import com.elegantevents.service.BookingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@CrossOrigin(origins = "${app.frontend.url:http://localhost:5173}")
public class BookingController {
    
    private final BookingService bookingService;
    
    public BookingController(BookingService bookingService) {
        this.bookingService = bookingService;
    }
    
    @PostMapping("/couple/{coupleClerkId}")
    public ResponseEntity<Map<String, Object>> createBooking(
            @PathVariable String coupleClerkId,
            @Valid @RequestBody BookingRequest request) {
        try {
            Booking booking = bookingService.createBooking(coupleClerkId, request);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("booking", booking);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
    
    @GetMapping("/couple/{coupleClerkId}")
    public ResponseEntity<List<Booking>> getCoupleBookings(@PathVariable String coupleClerkId) {
        List<Booking> bookings = bookingService.getBookingsByCouple(coupleClerkId);
        return ResponseEntity.ok(bookings);
    }
    
    @GetMapping("/vendor/{vendorClerkId}")
    public ResponseEntity<List<Booking>> getVendorBookings(@PathVariable String vendorClerkId) {
        List<Booking> bookings = bookingService.getBookingsByVendor(vendorClerkId);
        return ResponseEntity.ok(bookings);
    }
    
    @GetMapping("/{bookingId}/{clerkId}")
    public ResponseEntity<Booking> getBooking(@PathVariable Long bookingId, @PathVariable String clerkId) {
        try {
            Booking booking = bookingService.getBookingById(bookingId, clerkId);
            return ResponseEntity.ok(booking);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    @PatchMapping("/{bookingId}/vendor/{vendorClerkId}/status")
    public ResponseEntity<Map<String, Object>> updateBookingStatus(
            @PathVariable Long bookingId,
            @PathVariable String vendorClerkId,
            @RequestBody Map<String, String> statusMap) {
        try {
            Booking.BookingStatus status = Booking.BookingStatus.valueOf(statusMap.get("status").toUpperCase());
            Booking booking = bookingService.updateBookingStatus(bookingId, vendorClerkId, status);
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("booking", booking);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("error", e.getMessage());
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorResponse);
        }
    }
}









