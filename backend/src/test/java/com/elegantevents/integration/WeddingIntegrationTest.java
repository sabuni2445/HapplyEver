package com.elegantevents.integration;

import com.elegantevents.model.Wedding;
import com.elegantevents.repository.WeddingRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.time.LocalDate;

import static org.hamcrest.CoreMatchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

public class WeddingIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private WeddingRepository weddingRepository;

    @BeforeEach
    void setup() {
        weddingRepository.deleteAll();
    }

    @Test
    public void givenWeddingObject_whenCreateWedding_thenReturnSavedWedding() throws Exception {
        // given
        Wedding wedding = new Wedding();
        wedding.setPartnersName("Integration Test Couple");
        wedding.setClerkId("clerk_test_123");
        wedding.setWeddingDate(LocalDate.now().plusMonths(6));

        // when
        ResultActions response = mockMvc.perform(post("/api/weddings")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(wedding)));

        // then
        response.andExpect(status().isCreated())
                .andExpect(jsonPath("$.partnersName", is(wedding.getPartnersName())))
                .andExpect(jsonPath("$.clerkId", is(wedding.getClerkId())));
    }

    @Test
    public void givenListOfWeddings_whenGetAllWeddings_thenReturnWeddingsList() throws Exception {
        // given
        Wedding wedding1 = new Wedding();
        wedding1.setPartnersName("Couple 1");
        wedding1.setClerkId("user1");
        
        Wedding wedding2 = new Wedding();
        wedding2.setPartnersName("Couple 2");
        wedding2.setClerkId("user2");

        weddingRepository.save(wedding1);
        weddingRepository.save(wedding2);

        // when
        ResultActions response = mockMvc.perform(get("/api/weddings"));

        // then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.size()", is(2)));
    }

    @Test
    public void givenWeddingId_whenGetWeddingById_thenReturnWeddingObject() throws Exception {
        // given
        Wedding wedding = new Wedding();
        wedding.setPartnersName("Search Test");
        wedding.setClerkId("user_search");
        Wedding savedWedding = weddingRepository.save(wedding);

        // when
        ResultActions response = mockMvc.perform(get("/api/weddings/{id}", savedWedding.getId()));

        // then
        response.andExpect(status().isOk())
                .andExpect(jsonPath("$.partnersName", is(wedding.getPartnersName())));
    }
}
