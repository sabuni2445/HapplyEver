package com.elegantevents.service;

import com.elegantevents.dto.WeddingRequest;
import com.elegantevents.model.Wedding;
import com.elegantevents.model.User;
import com.elegantevents.repository.WeddingRepository;
import com.elegantevents.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class WeddingService {
    
    private final WeddingRepository weddingRepository;
    private final UserRepository userRepository;
    
    public WeddingService(WeddingRepository weddingRepository, UserRepository userRepository) {
        this.weddingRepository = weddingRepository;
        this.userRepository = userRepository;
    }
    
    public Wedding createOrUpdateWedding(String clerkId, WeddingRequest request) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("User not found with clerkId: " + clerkId));
        
        Wedding wedding = weddingRepository.findByClerkId(clerkId)
                .map(existing -> {
                    // Update existing wedding
                    updateWeddingFields(existing, request);
                    return existing;
                })
                .orElseGet(() -> {
                    // Create new wedding
                    Wedding newWedding = new Wedding();
                    newWedding.setClerkId(clerkId);
                    newWedding.setUserId(user.getId());
                    updateWeddingFields(newWedding, request);
                    return newWedding;
                });
        
        return weddingRepository.save(wedding);
    }
    
    private void updateWeddingFields(Wedding wedding, WeddingRequest request) {
        if (request.getPartnersName() != null) wedding.setPartnersName(request.getPartnersName());
        if (request.getWeddingDate() != null) wedding.setWeddingDate(request.getWeddingDate());
        if (request.getWeddingTime() != null) wedding.setWeddingTime(request.getWeddingTime());
        if (request.getLocation() != null) wedding.setLocation(request.getLocation());
        if (request.getVenue() != null) wedding.setVenue(request.getVenue());
        if (request.getBudget() != null) wedding.setBudget(request.getBudget());
        if (request.getNumberOfGuests() != null) wedding.setNumberOfGuests(request.getNumberOfGuests());
        if (request.getTheme() != null) wedding.setTheme(request.getTheme());
        if (request.getCatering() != null) wedding.setCatering(request.getCatering());
        if (request.getDecorations() != null) wedding.setDecorations(request.getDecorations());
        if (request.getMusic() != null) wedding.setMusic(request.getMusic());
        if (request.getPhotography() != null) wedding.setPhotography(request.getPhotography());
        if (request.getRules() != null) wedding.setRules(request.getRules());
        if (request.getAdditionalNotes() != null) wedding.setAdditionalNotes(request.getAdditionalNotes());
    }
    
    @Transactional(readOnly = true)
    public Wedding getWeddingByClerkId(String clerkId) {
        return weddingRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Wedding not found for clerkId: " + clerkId));
    }
    
    public void deleteWedding(String clerkId) {
        Wedding wedding = weddingRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("Wedding not found for clerkId: " + clerkId));
        weddingRepository.delete(wedding);
    }
    
    @Transactional(readOnly = true)
    public List<Wedding> getAllWeddings() {
        return weddingRepository.findAll();
    }
    
    @Transactional(readOnly = true)
    public Wedding getWeddingById(Long weddingId) {
        return weddingRepository.findById(weddingId)
                .orElseThrow(() -> new RuntimeException("Wedding not found"));
    }

    public Wedding updateStatus(Long weddingId, Wedding.WeddingStatus status) {
        Wedding wedding = weddingRepository.findById(weddingId)
                .orElseThrow(() -> new RuntimeException("Wedding not found"));
        wedding.setStatus(status);
        return weddingRepository.save(wedding);
    }
}

