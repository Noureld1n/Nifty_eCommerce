package com.newtin.eco.dto.response;

import com.newtin.eco.model.Feedback;
import com.newtin.eco.model.User;
import java.time.LocalDateTime;

public record AdminFeedbackResponse(Long id, Long customerId, String customerName, String customerEmail,
                                    String text, Boolean satisfied, LocalDateTime createdAt) {
    public static AdminFeedbackResponse from(Feedback f) {
        User u = f.getCustomer().getUser();
        return new AdminFeedbackResponse(f.getId(), f.getCustomer().getId(),
                u.getFirstName() + " " + u.getLastName(), u.getEmail(),
                f.getText(), f.getSatisfied(), f.getCreatedAt());
    }
}