package com.elegantevents.service;

import com.elegantevents.dto.*;
import com.elegantevents.model.*;
import com.elegantevents.repository.*;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final UserRepository userRepository;
    private final WeddingRepository weddingRepository;
    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final ServiceRepository serviceRepository;
    private final RatingRepository ratingRepository;

    public AnalyticsService(UserRepository userRepository,
                            WeddingRepository weddingRepository,
                            PaymentRepository paymentRepository,
                            BookingRepository bookingRepository,
                            ServiceRepository serviceRepository,
                            RatingRepository ratingRepository) {
        this.userRepository = userRepository;
        this.weddingRepository = weddingRepository;
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.serviceRepository = serviceRepository;
        this.ratingRepository = ratingRepository;
    }

    public AdminAnalyticsResponse getAdminAnalytics() {
        AdminAnalyticsResponse response = new AdminAnalyticsResponse();

        // Basic Counts
        List<User> allUsers = userRepository.findAll();
        response.setTotalUsers(allUsers.size());
        response.setTotalVendors(allUsers.stream()
                .filter(u -> "VENDOR".equals(u.getSelectedRole()))
                .count());

        List<Wedding> allWeddings = weddingRepository.findAll();
        response.setTotalWeddings(allWeddings.size());
        response.setActiveWeddings(allWeddings.stream()
                .filter(w -> w.getStatus() != Wedding.WeddingStatus.COMPLETED)
                .count());

        // Revenue
        List<Payment> paidPayments = paymentRepository.findAll().stream()
                .filter(p -> p.getStatus() == Payment.PaymentStatus.PAID)
                .collect(Collectors.toList());

        double totalRevenue = paidPayments.stream()
                .mapToDouble(p -> p.getAmount().doubleValue())
                .sum();
        response.setTotalRevenue(totalRevenue);

        // Monthly Data (Last 6 months)
        response.setMonthlyRevenue(calculateMonthlyRevenue(paidPayments));

        // Package Distribution
        response.setPackageDistribution(calculatePackageDistribution(allWeddings));

        // Top Vendors
        response.setTopVendors(calculateTopVendors());

        return response;
    }

    private List<MonthlyDataDTO> calculateMonthlyRevenue(List<Payment> payments) {
        Map<String, MonthlyDataDTO> monthlyMap = new LinkedHashMap<>();
        
        // Initialize last 6 months
        LocalDateTime now = LocalDateTime.now();
        for (int i = 5; i >= 0; i--) {
            LocalDateTime date = now.minusMonths(i);
            String monthName = date.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            monthlyMap.put(monthName, new MonthlyDataDTO(monthName, 0.0, 0));
        }

        for (Payment p : payments) {
            LocalDateTime date = p.getPaidDate() != null ? p.getPaidDate() : p.getCreatedAt();
            String monthName = date.getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            if (monthlyMap.containsKey(monthName)) {
                MonthlyDataDTO dto = monthlyMap.get(monthName);
                dto.setRevenue(dto.getRevenue() + p.getAmount().doubleValue());
                monthlyMap.put(monthName, dto);
            }
        }
        
        // Count bookings per month
        List<Booking> allBookings = bookingRepository.findAll();
        for (Booking b : allBookings) {
            String monthName = b.getCreatedAt().getMonth().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
            if (monthlyMap.containsKey(monthName)) {
                MonthlyDataDTO dto = monthlyMap.get(monthName);
                dto.setBookings(dto.getBookings() + 1);
            }
        }

        return new ArrayList<>(monthlyMap.values());
    }

    private List<PackageStatDTO> calculatePackageDistribution(List<Wedding> weddings) {
        // Since we don't have a direct 'Package' entity linked in the Wedding model yet,
        // we'll derive it from the budget or photographer/catering fields for realism.
        long standard = weddings.stream().filter(w -> w.getBudget() != null && w.getBudget() < 50000).count();
        long premium = weddings.stream().filter(w -> w.getBudget() != null && w.getBudget() >= 50000 && w.getBudget() < 150000).count();
        long luxury = weddings.stream().filter(w -> w.getBudget() != null && w.getBudget() >= 150000).count();
        long total = weddings.size();

        if (total == 0) return new ArrayList<>();

        List<PackageStatDTO> stats = new ArrayList<>();
        stats.add(new PackageStatDTO("Standard Pack", standard, (standard * 100.0 / total), "#94a3b8"));
        stats.add(new PackageStatDTO("Premium Pack", premium, (premium * 100.0 / total), "#d4af37"));
        stats.add(new PackageStatDTO("Luxury Elite", luxury, (luxury * 100.0 / total), "#523c2b"));
        return stats;
    }

    private List<VendorStatDTO> calculateTopVendors() {
        List<Booking> acceptedBookings = bookingRepository.findAll().stream()
                .filter(b -> b.getStatus() == Booking.BookingStatus.ACCEPTED || b.getStatus() == Booking.BookingStatus.COMPLETED)
                .collect(Collectors.toList());

        Map<String, List<Booking>> vendorBookings = acceptedBookings.stream()
                .collect(Collectors.groupingBy(Booking::getVendorClerkId));

        List<VendorStatDTO> vendors = new ArrayList<>();

        for (Map.Entry<String, List<Booking>> entry : vendorBookings.entrySet()) {
            String clerkId = entry.getKey();
            List<Booking> bookings = entry.getValue();
            
            User vendor = userRepository.findByClerkId(clerkId).orElse(null);
            if (vendor == null) continue;

            double revenue = 0;
            for (Booking b : bookings) {
                com.elegantevents.model.Service s = serviceRepository.findById(b.getServiceId()).orElse(null);
                if (s != null && s.getPrice() != null) {
                    revenue += s.getPrice();
                }
            }

            double avgRating = ratingRepository.findByVendorClerkId(clerkId).stream()
                    .mapToInt(Rating::getRating)
                    .average()
                    .orElse(4.5); // Default rating if none

            vendors.add(new VendorStatDTO(
                vendor.getFirstName() + " " + vendor.getLastName(),
                bookings.isEmpty() ? "Wedding Services" : getServiceName(bookings.get(0).getServiceId()),
                revenue,
                avgRating,
                bookings.size()
            ));
        }

        return vendors.stream()
                .sorted(Comparator.comparingDouble(VendorStatDTO::getRevenue).reversed())
                .limit(5)
                .collect(Collectors.toList());
    }

    private String getServiceName(Long serviceId) {
        return serviceRepository.findById(serviceId)
                .map(com.elegantevents.model.Service::getCategory)
                .orElse("Services");
    }
}
