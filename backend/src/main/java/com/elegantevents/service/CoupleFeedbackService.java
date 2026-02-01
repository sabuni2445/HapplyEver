package com.elegantevents.service;

import com.elegantevents.model.CoupleFeedback;
import com.elegantevents.repository.CoupleFeedbackRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional
public class CoupleFeedbackService {
    
    private final CoupleFeedbackRepository feedbackRepository;
    
    public CoupleFeedbackService(CoupleFeedbackRepository feedbackRepository) {
        this.feedbackRepository = feedbackRepository;
    }
    
    public List<CoupleFeedback> submitFeedbacks(List<Map<String, Object>> feedbackRequests) {
        List<CoupleFeedback> feedbacks = feedbackRequests.stream().map(req -> {
            CoupleFeedback feedback = new CoupleFeedback();
            feedback.setWeddingId(((Number) req.get("weddingId")).longValue());
            feedback.setCoupleClerkId((String) req.get("coupleClerkId"));
            feedback.setCategory((String) req.get("category"));
            feedback.setTargetId((String) req.get("targetId"));
            feedback.setRating((Integer) req.get("rating"));
            feedback.setComment((String) req.get("comment"));
            return feedback;
        }).collect(Collectors.toList());
        
        return feedbackRepository.saveAll(feedbacks);
    }
    
    public List<CoupleFeedback> getFeedbacksByWedding(Long weddingId) {
        return feedbackRepository.findByWeddingId(weddingId);
    }
}
