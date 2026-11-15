package com.newtin.eco.repository;

import com.newtin.eco.dto.response.AdminAnalyticsResponse;
import com.newtin.eco.enums.AnalyticsRange;

public interface AdminAnalyticsRepository {
    AdminAnalyticsResponse dashboard(AnalyticsRange range, int offset);
}
