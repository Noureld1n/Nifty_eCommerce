package com.newtin.eco.service;

import com.newtin.eco.dto.request.CreateFeedbackRequest;
import com.newtin.eco.dto.response.AdminFeedbackResponse;
import com.newtin.eco.dto.response.FeedbackResponse;
import com.newtin.eco.exception.TooManyRequestsException;
import com.newtin.eco.model.Feedback;
import com.newtin.eco.repository.CustomerRepository;
import com.newtin.eco.repository.FeedbackRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class FeedbackService {
    private static final int MAX_PER_DAY = 5;

    private final FeedbackRepository feedbackRepository;
    private final CustomerRepository customerRepository;

    @Transactional
    public FeedbackResponse create(Long customerId, CreateFeedbackRequest req) {
        if (feedbackRepository.countByCustomerIdAndCreatedAtAfter(
                customerId, LocalDateTime.now().minusDays(1)) >= MAX_PER_DAY)
            throw new TooManyRequestsException("Feedback limit reached. Please try again later.");

        Feedback saved = feedbackRepository.save(Feedback.builder()
                .customer(customerRepository.getReferenceById(customerId))
                .text(req.text().trim())
                .satisfied(req.satisfied())
                .build());
        return FeedbackResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public Page<FeedbackResponse> listMine(Long customerId, Pageable pageable) {
        return feedbackRepository.findMine(customerId, pageable).map(FeedbackResponse::from);
    }

    @Transactional(readOnly = true)
    public Page<AdminFeedbackResponse> listAll(Boolean satisfied, Pageable pageable) {
        return feedbackRepository.findAllForAdmin(satisfied, pageable).map(AdminFeedbackResponse::from);
    }
}