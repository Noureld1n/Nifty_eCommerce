package com.newtin.eco.service;

import com.newtin.eco.dto.response.AdminAnalyticsResponse;
import com.newtin.eco.enums.AnalyticsRange;
import com.newtin.eco.exception.BadRequestException;
import com.newtin.eco.repository.AdminAnalyticsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AdminAnalyticsService {
    private final AdminAnalyticsRepository analyticsRepository;

    @Transactional(readOnly = true)
    public AdminAnalyticsResponse dashboard(AnalyticsRange range, int offset) {
        if (offset < 0 || offset > 1200)
            throw new BadRequestException("Analytics offset must be between 0 and 1200");
        return analyticsRepository.dashboard(range, offset);
    }
}
