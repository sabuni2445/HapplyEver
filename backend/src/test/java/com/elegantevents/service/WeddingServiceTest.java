package com.elegantevents.service;

import com.elegantevents.dto.WeddingRequest;
import com.elegantevents.model.User;
import com.elegantevents.model.Wedding;
import com.elegantevents.repository.UserRepository;
import com.elegantevents.repository.WeddingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WeddingServiceTest {

    @Mock
    private WeddingRepository weddingRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private WeddingService weddingService;

    private Wedding testWedding;
    private User testUser;
    private WeddingRequest weddingRequest;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setClerkId("user_123");

        testWedding = new Wedding();
        testWedding.setId(1L);
        testWedding.setPartnersName("John & Jane");
        testWedding.setClerkId("user_123");
        testWedding.setUserId(1L);
        testWedding.setWeddingDate(LocalDate.of(2026, 6, 15));
        testWedding.setLocation("Sheraton Addis");
        testWedding.setNumberOfGuests(200);

        weddingRequest = new WeddingRequest();
        weddingRequest.setPartnersName("John & Jane");
        weddingRequest.setWeddingDate(LocalDate.of(2026, 6, 15));
        weddingRequest.setLocation("Sheraton Addis");
        weddingRequest.setNumberOfGuests(200);
    }

    @Test
    void createOrUpdateWedding_ShouldCreateNewWedding_WhenNotExists() {
        when(userRepository.findByClerkId("user_123")).thenReturn(Optional.of(testUser));
        when(weddingRepository.findByClerkId("user_123")).thenReturn(Optional.empty());
        when(weddingRepository.save(any(Wedding.class))).thenReturn(testWedding);

        Wedding result = weddingService.createOrUpdateWedding("user_123", weddingRequest);

        assertNotNull(result);
        assertEquals("John & Jane", result.getPartnersName());
        assertEquals("user_123", result.getClerkId());
        verify(weddingRepository, times(1)).save(any(Wedding.class));
    }

    @Test
    void getWeddingById_ShouldReturnWedding_WhenExists() {
        when(weddingRepository.findById(1L)).thenReturn(Optional.of(testWedding));

        Wedding result = weddingService.getWeddingById(1L);

        assertNotNull(result);
        assertEquals("John & Jane", result.getPartnersName());
    }

    @Test
    void getWeddingById_ShouldThrowException_WhenNotExists() {
        when(weddingRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> weddingService.getWeddingById(999L));
    }

    @Test
    void getWeddingByClerkId_ShouldReturnWedding_WhenExists() {
        when(weddingRepository.findByClerkId("user_123")).thenReturn(Optional.of(testWedding));

        Wedding result = weddingService.getWeddingByClerkId("user_123");

        assertNotNull(result);
        assertEquals("John & Jane", result.getPartnersName());
    }

    @Test
    void getAllWeddings_ShouldReturnList() {
        Wedding wedding2 = new Wedding();
        wedding2.setId(2L);
        wedding2.setPartnersName("Alice & Bob");
        
        List<Wedding> weddings = Arrays.asList(testWedding, wedding2);
        when(weddingRepository.findAll()).thenReturn(weddings);

        List<Wedding> result = weddingService.getAllWeddings();

        assertEquals(2, result.size());
    }

    @Test
    void deleteWedding_ShouldCallRepository() {
        when(weddingRepository.findByClerkId("user_123")).thenReturn(Optional.of(testWedding));
        doNothing().when(weddingRepository).delete(testWedding);

        weddingService.deleteWedding("user_123");

        verify(weddingRepository, times(1)).delete(testWedding);
    }
}

