package com.elegantevents.service;

import com.elegantevents.model.User;
import com.elegantevents.model.VendorPackageOrder;
import com.elegantevents.repository.UserRepository;
import com.elegantevents.repository.VendorPackageRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class PackageExpiryScheduler {

    private final UserRepository userRepository;
    private final VendorPackageRepository packageRepository;

    public PackageExpiryScheduler(UserRepository userRepository, VendorPackageRepository packageRepository) {
        this.userRepository = userRepository;
        this.packageRepository = packageRepository;
    }

    /**
     * Runs every hour to check for expired packages.
     * Can be changed to cron expression for daily check at midnight.
     */
    @Scheduled(fixedRate = 3600000) // 1 hour
    @Transactional
    public void checkForExpiredPackages() {
        LocalDateTime now = LocalDateTime.now();
        List<User> expiredUsers = userRepository.findExpiredPackages(now);

        for (User user : expiredUsers) {
            user.setPackageType(User.PackageType.NORMAL);
            user.setPackageExpiryDate(null);
            userRepository.save(user);

            // Also mark orders as expired if they were the latest
            // Optional: notify vendor via email/app notification
        }
    }
}
