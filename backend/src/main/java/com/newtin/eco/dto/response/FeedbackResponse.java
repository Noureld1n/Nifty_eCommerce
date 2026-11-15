package com.newtin.eco.dto.response;

import com.newtin.eco.model.Feedback;
import java.time.LocalDateTime;

public record FeedbackResponse(Long id, String text, Boolean satisfied, LocalDateTime createdAt) {
    public static FeedbackResponse from(Feedback f) {
        return new FeedbackResponse(f.getId(), f.getText(), f.getSatisfied(), f.getCreatedAt());
    }
}