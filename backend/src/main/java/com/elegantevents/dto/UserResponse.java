package com.elegantevents.dto;

import com.elegantevents.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Long id;
    private String clerkId;
    private String email;
    private String firstName;
    private String lastName;
    private String username;
    private String imageUrl;
    private String phoneNumber;
    private User.UserRole selectedRole;
    private User.PackageType packageType;
    private Boolean profileCompleted;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    
    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .clerkId(user.getClerkId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .username(user.getUsername())
                .imageUrl(user.getImageUrl())
                .phoneNumber(user.getPhoneNumber())
                .selectedRole(user.getSelectedRole())
                .packageType(user.getPackageType())
                .profileCompleted(user.getProfileCompleted())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build();
    }
}










