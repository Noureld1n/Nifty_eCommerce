package com.newtin.eco.controller.admin;

import com.newtin.eco.dto.response.AdminAnalyticsResponse;
import com.newtin.eco.enums.AnalyticsRange;
import com.newtin.eco.service.AdminAnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/analytics")
@RequiredArgsConstructor
public class AdminAnalyticsController {
    private final AdminAnalyticsService analyticsService;

    @GetMapping
    public AdminAnalyticsResponse dashboard(
            @RequestParam(defaultValue = "YEAR") AnalyticsRange range,
            @RequestParam(defaultValue = "0") int offset) {
        return analyticsService.dashboard(range, offset);
    }
}
