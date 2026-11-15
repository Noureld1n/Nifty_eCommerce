package com.newtin.eco.controller.user;

import com.newtin.eco.dto.request.CreateFeedbackRequest;
import com.newtin.eco.dto.response.FeedbackResponse;
import com.newtin.eco.security.CustomUserDetails;
import com.newtin.eco.service.FeedbackService;
import com.newtin.eco.util.Pages;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user/feedback")
@RequiredArgsConstructor
public class FeedbackController {
    private final FeedbackService feedbackService;

    @PostMapping
    public ResponseEntity<FeedbackResponse> create(@AuthenticationPrincipal CustomUserDetails principal,
                                                   @Valid @RequestBody CreateFeedbackRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(feedbackService.create(principal.getId(), req));
    }

    @GetMapping
    public PagedModel<FeedbackResponse> mine(@AuthenticationPrincipal CustomUserDetails principal,
                                             @RequestParam(defaultValue = "0") int page,
                                             @RequestParam(defaultValue = "20") int size) {
        return new PagedModel<>(feedbackService.listMine(principal.getId(), Pages.of(page, size)));
    }
}