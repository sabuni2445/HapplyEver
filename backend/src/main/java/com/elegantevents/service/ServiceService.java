package com.elegantevents.service;

import com.elegantevents.dto.ServiceRequest;
import com.elegantevents.model.User;
import com.elegantevents.repository.ServiceRepository;
import com.elegantevents.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ServiceService {
    
    private final ServiceRepository serviceRepository;
    private final UserRepository userRepository;
    
    public ServiceService(ServiceRepository serviceRepository, UserRepository userRepository) {
        this.serviceRepository = serviceRepository;
        this.userRepository = userRepository;
    }
    
    public com.elegantevents.model.Service createService(String clerkId, ServiceRequest request) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("User not found with clerkId: " + clerkId));
        
        com.elegantevents.model.Service service = new com.elegantevents.model.Service();
        service.setClerkId(clerkId);
        service.setVendorId(user.getId());
        service.setServiceName(request.getServiceName());
        service.setStatus(com.elegantevents.model.Service.ServiceStatus.valueOf(request.getStatus().toUpperCase()));
        service.setAvailabilityStatus(com.elegantevents.model.Service.AvailabilityStatus.AVAILABLE);
        service.setCategory(request.getCategory());
        service.setDescription(request.getDescription());
        service.setPrice(request.getPrice());
        service.setAmount(request.getAmount());
        service.setDuration(request.getDuration());
        service.setLocation(request.getLocation());
        service.setAvailability(request.getAvailability());
        service.setImageUrl(request.getImageUrl());
        service.setVideoUrl(request.getVideoUrl());
        
        return serviceRepository.save(service);
    }
    
    @Transactional(readOnly = true)
    public List<com.elegantevents.model.Service> getServicesByClerkId(String clerkId) {
        return serviceRepository.findByClerkId(clerkId);
    }
    
    @Transactional(readOnly = true)
    public List<com.elegantevents.model.Service> getAllActiveServices() {
        return serviceRepository.findAll().stream()
                .filter(s -> s.getStatus() == com.elegantevents.model.Service.ServiceStatus.ACTIVE)
                .sorted((s1, s2) -> {
                    User u1 = userRepository.findByClerkId(s1.getClerkId()).orElse(null);
                    User u2 = userRepository.findByClerkId(s2.getClerkId()).orElse(null);
                    
                    int p1 = u1 != null && u1.getPackageType() != null ? u1.getPackageType().ordinal() : 0;
                    int p2 = u2 != null && u2.getPackageType() != null ? u2.getPackageType().ordinal() : 0;
                    
                    if (p1 != p2) return p2 - p1; // Higher ordinal first (Premium > Gold > Normal)
                    return s2.getCreatedAt().compareTo(s1.getCreatedAt()); // Then by date
                })
                .collect(java.util.stream.Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public com.elegantevents.model.Service getServiceById(Long id) {
        return serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
    }
    
    @Transactional(readOnly = true)
    public com.elegantevents.model.Service getServiceById(Long id, String clerkId) {
        return serviceRepository.findByIdAndClerkId(id, clerkId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
    }
    
    public com.elegantevents.model.Service updateService(Long id, String clerkId, ServiceRequest request) {
        com.elegantevents.model.Service service = serviceRepository.findByIdAndClerkId(id, clerkId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        
        if (request.getServiceName() != null) service.setServiceName(request.getServiceName());
        if (request.getStatus() != null) service.setStatus(com.elegantevents.model.Service.ServiceStatus.valueOf(request.getStatus().toUpperCase()));
        if (request.getCategory() != null) service.setCategory(request.getCategory());
        if (request.getDescription() != null) service.setDescription(request.getDescription());
        if (request.getPrice() != null) service.setPrice(request.getPrice());
        if (request.getAmount() != null) service.setAmount(request.getAmount());
        if (request.getDuration() != null) service.setDuration(request.getDuration());
        if (request.getLocation() != null) service.setLocation(request.getLocation());
        if (request.getAvailability() != null) service.setAvailability(request.getAvailability());
        if (request.getImageUrl() != null) service.setImageUrl(request.getImageUrl());
        if (request.getVideoUrl() != null) service.setVideoUrl(request.getVideoUrl());
        if (request.getAvailabilityStatus() != null) {
            try {
                service.setAvailabilityStatus(com.elegantevents.model.Service.AvailabilityStatus.valueOf(
                    request.getAvailabilityStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                // Invalid status, skip
            }
        }
        
        return serviceRepository.save(service);
    }
    
    public com.elegantevents.model.Service updateAvailabilityStatus(Long id, String clerkId, String availabilityStatus) {
        com.elegantevents.model.Service service = serviceRepository.findByIdAndClerkId(id, clerkId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        
        try {
            com.elegantevents.model.Service.AvailabilityStatus status = 
                com.elegantevents.model.Service.AvailabilityStatus.valueOf(availabilityStatus.toUpperCase());
            service.setAvailabilityStatus(status);
            return serviceRepository.save(service);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Invalid availability status: " + availabilityStatus);
        }
    }
    
    public void deleteService(Long id, String clerkId) {
        com.elegantevents.model.Service service = serviceRepository.findByIdAndClerkId(id, clerkId)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        serviceRepository.delete(service);
    }
}

