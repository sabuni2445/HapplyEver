package com.elegantevents.service;

import com.elegantevents.model.User;
import com.elegantevents.model.VendorPackageOrder;
import com.elegantevents.repository.UserRepository;
import com.elegantevents.repository.VendorPackageRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
public class VendorPackageService {

    private final VendorPackageRepository packageRepository;
    private final UserRepository userRepository;
    private final ChapaPaymentService chapaPaymentService;

    public VendorPackageService(VendorPackageRepository packageRepository, 
                                UserRepository userRepository,
                                ChapaPaymentService chapaPaymentService) {
        this.packageRepository = packageRepository;
        this.userRepository = userRepository;
        this.chapaPaymentService = chapaPaymentService;
    }

    @Transactional
    public Map<String, Object> initializePackageUpgrade(String clerkId, 
                                                        User.PackageType packageType, 
                                                        VendorPackageOrder.Duration duration,
                                                        Double amount) {
        
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String txRef = "v-pkg-" + UUID.randomUUID().toString();
        
        VendorPackageOrder order = new VendorPackageOrder();
        order.setClerkId(clerkId);
        order.setPackageType(packageType);
        order.setDuration(duration);
        order.setAmount(amount);
        order.setTxRef(txRef);
        order.setStatus(VendorPackageOrder.OrderStatus.PENDING);
        packageRepository.save(order);

        // Initialize Chapa payment
        // Using chapa.co as return URL to match working couple flow
        String returnUrl = "https://chapa.co";
        return chapaPaymentService.initializePayment(
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getPhoneNumber(),
                amount,
                txRef,
                returnUrl
        );
    }

    @Transactional
    public void requestManualUpgrade(String clerkId, 
                                     User.PackageType packageType, 
                                     VendorPackageOrder.Duration duration,
                                     Double amount) {
        
        VendorPackageOrder order = new VendorPackageOrder();
        order.setClerkId(clerkId);
        order.setPackageType(packageType);
        order.setDuration(duration);
        order.setAmount(amount);
        order.setStatus(VendorPackageOrder.OrderStatus.MANUAL_PENDING);
        packageRepository.save(order);
    }

    @Transactional
    public void verifyAndActivatePackage(String txRef) {
        VendorPackageOrder order = packageRepository.findByTxRef(txRef)
                .orElseThrow(() -> new RuntimeException("Order not found"));

        if (order.getStatus() == VendorPackageOrder.OrderStatus.PAID) {
            return; // Already processed
        }

        Map<String, Object> verification = chapaPaymentService.verifyPayment(txRef);
        if ("success".equals(verification.get("status"))) {
            activatePackage(order);
        }
    }

    @Transactional
    public void activatePackage(VendorPackageOrder order) {
        User user = userRepository.findByClerkId(order.getClerkId())
                .orElseThrow(() -> new RuntimeException("User not found"));

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime currentExpiry = user.getPackageExpiryDate();
        LocalDateTime baseDate = (currentExpiry != null && currentExpiry.isAfter(now)) ? currentExpiry : now;

        LocalDateTime newExpiry;
        if (order.getDuration() == VendorPackageOrder.Duration.MONTH_12) {
            newExpiry = baseDate.plusMonths(12);
        } else if (order.getDuration() == VendorPackageOrder.Duration.MONTH_6) {
            newExpiry = baseDate.plusMonths(6);
        } else {
            newExpiry = baseDate.plusMonths(1);
        }

        user.setPackageType(order.getPackageType());
        user.setPackageExpiryDate(newExpiry);
        userRepository.save(user);

        order.setStatus(VendorPackageOrder.OrderStatus.PAID);
        order.setExpiryDate(newExpiry);
        packageRepository.save(order);
    }

    @Transactional
    public void approveManualUpgrade(Long orderId) {
        VendorPackageOrder order = packageRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Order not found"));
        
        if (order.getStatus() != VendorPackageOrder.OrderStatus.MANUAL_PENDING) {
            throw new RuntimeException("Order is not in MANUAL_PENDING status");
        }
        
        activatePackage(order);
    }
}
