package com.elegantevents.service;

import com.elegantevents.dto.UserSyncRequest;
import com.elegantevents.dto.UserResponse;
import com.elegantevents.model.User;
import com.elegantevents.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class UserService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    
    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }
    
    public UserResponse syncUser(UserSyncRequest request) {
        User user = userRepository.findByClerkId(request.getClerkId())
                .map(existingUser -> {
                    // Update existing user
                    existingUser.setEmail(request.getEmail());
                    existingUser.setFirstName(request.getFirstName());
                    existingUser.setLastName(request.getLastName());
                    existingUser.setUsername(request.getUsername());
                    existingUser.setImageUrl(request.getImageUrl());
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    // Create new user
                    User newUser = new User();
                    newUser.setClerkId(request.getClerkId());
                    newUser.setEmail(request.getEmail());
                    newUser.setFirstName(request.getFirstName());
                    newUser.setLastName(request.getLastName());
                    newUser.setUsername(request.getUsername());
                    newUser.setImageUrl(request.getImageUrl());
                    newUser.setProfileCompleted(false);
                    return userRepository.save(newUser);
                });
        
        return UserResponse.fromEntity(user);
    }
    
    public UserResponse createOrUpdateUser(String clerkId, String email, String firstName, 
                                          String lastName, String username, String imageUrl) {
        User user = userRepository.findByClerkId(clerkId)
                .map(existingUser -> {
                    existingUser.setEmail(email);
                    existingUser.setFirstName(firstName);
                    existingUser.setLastName(lastName);
                    existingUser.setUsername(username);
                    existingUser.setImageUrl(imageUrl);
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setClerkId(clerkId);
                    newUser.setEmail(email);
                    newUser.setFirstName(firstName);
                    newUser.setLastName(lastName);
                    newUser.setUsername(username);
                    newUser.setImageUrl(imageUrl);
                    newUser.setProfileCompleted(false);
                    return userRepository.save(newUser);
                });
        
        return UserResponse.fromEntity(user);
    }
    
    @Transactional(readOnly = true)
    public UserResponse getUserByClerkId(String clerkId) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("User not found with clerkId: " + clerkId));
        return UserResponse.fromEntity(user);
    }
    
    @Transactional(readOnly = true)
    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
        return UserResponse.fromEntity(user);
    }
    
    public UserResponse updateUserRole(String clerkId, User.UserRole role) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("User not found with clerkId: " + clerkId));
        user.setSelectedRole(role);
        user.setProfileCompleted(true);
        return UserResponse.fromEntity(userRepository.save(user));
    }
    
    public UserResponse updateUserProfile(String clerkId, User userUpdate) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("User not found with clerkId: " + clerkId));
        
        if (userUpdate.getFirstName() != null) user.setFirstName(userUpdate.getFirstName());
        if (userUpdate.getLastName() != null) user.setLastName(userUpdate.getLastName());
        if (userUpdate.getPhoneNumber() != null) user.setPhoneNumber(userUpdate.getPhoneNumber());
        if (userUpdate.getImageUrl() != null) {
            user.setImageUrl(userUpdate.getImageUrl());
        }
        
        user.setProfileCompleted(true);
        return UserResponse.fromEntity(userRepository.save(user));
    }
    
    public void deleteUser(String clerkId) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("User not found with clerkId: " + clerkId));
        userRepository.delete(user);
    }
    
    @Transactional(readOnly = true)
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }
    
    @Transactional(readOnly = true)
    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }
    
    @Transactional(readOnly = true)
    public List<UserResponse> getUsersByRole(User.UserRole role) {
        return userRepository.findBySelectedRole(role).stream()
                .map(UserResponse::fromEntity)
                .collect(Collectors.toList());
    }
    
    public UserResponse setPassword(String clerkId, String password) {
        User user = userRepository.findByClerkId(clerkId)
                .orElseThrow(() -> new RuntimeException("User not found with clerkId: " + clerkId));
        user.setPassword(passwordEncoder.encode(password));
        return UserResponse.fromEntity(userRepository.save(user));
    }
    
    public boolean verifyPassword(User user, String rawPassword) {
        if (user.getPassword() == null || user.getPassword().isEmpty()) {
            return false; // No password set
        }
        return passwordEncoder.matches(rawPassword, user.getPassword());
    }
    
    public UserResponse createOrUpdateUserWithPassword(String clerkId, String email, String firstName,
                                                       String lastName, String username, String imageUrl, String password) {
        User user = userRepository.findByClerkId(clerkId)
                .map(existingUser -> {
                    existingUser.setEmail(email);
                    existingUser.setFirstName(firstName);
                    existingUser.setLastName(lastName);
                    existingUser.setUsername(username);
                    existingUser.setImageUrl(imageUrl);
                    if (password != null && !password.isEmpty()) {
                        existingUser.setPassword(passwordEncoder.encode(password));
                    }
                    return userRepository.save(existingUser);
                })
                .orElseGet(() -> {
                    User newUser = new User();
                    newUser.setClerkId(clerkId);
                    newUser.setEmail(email);
                    newUser.setFirstName(firstName);
                    newUser.setLastName(lastName);
                    newUser.setUsername(username);
                    newUser.setImageUrl(imageUrl);
                    newUser.setProfileCompleted(false);
                    if (password != null && !password.isEmpty()) {
                        newUser.setPassword(passwordEncoder.encode(password));
                    }
                    return userRepository.save(newUser);
                });
        
        return UserResponse.fromEntity(user);
    }
}


