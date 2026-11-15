package com.newtin.eco.controller.admin;

import com.newtin.eco.dto.response.AdminFeedbackResponse;
import com.newtin.eco.service.FeedbackService;
import com.newtin.eco.util.Pages;
import lombok.RequiredArgsConstructor;
import org.springframework.data.web.PagedModel;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/feedback")
@RequiredArgsConstructor
public class AdminFeedbackController {
    private final FeedbackService feedbackService;

    @GetMapping
    public PagedModel<AdminFeedbackResponse> list(@RequestParam(required = false) Boolean satisfied,
                                                  @RequestParam(defaultValue = "0") int page,
                                                  @RequestParam(defaultValue = "20") int size) {
        return new PagedModel<>(feedbackService.listAll(satisfied, Pages.of(page, size)));
    }
}