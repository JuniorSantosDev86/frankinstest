package com.frankintest.api;

import com.frankintest.api.system.ratelimit.RateLimitFilter;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * Base class for integration tests that call rate-limited endpoints.
 * Resets the rate limiter bucket map before each test to prevent cross-test bleed.
 */
public abstract class BaseIntegrationTest {

    @Autowired
    private RateLimitFilter rateLimitFilter;

    @BeforeEach
    void resetRateLimitBuckets() {
        rateLimitFilter.resetBuckets();
    }
}
