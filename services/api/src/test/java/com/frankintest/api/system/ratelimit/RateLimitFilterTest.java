package com.frankintest.api.system.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.TestJwtHelper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RateLimitFilterTest extends com.frankintest.api.BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbc;

    // Unique userId so rate limit buckets don't bleed across tests
    private static final String RATE_TEST_USER = "user_rate_limit_test_" + System.nanoTime();
    private static final String RATE_TEST_ORG = "org_rate_limit_test";
    private static final String TOKEN = TestJwtHelper.validToken(RATE_TEST_USER, List.of(RATE_TEST_ORG));

    private Map<String, Object> quickBody() {
        return Map.of(
            "targetType", "FEATURE_DESCRIPTION",
            "targetValue", "Rate limit test feature",
            "userAuthorizationConfirmed", true,
            "context", "Teste de rate limiting para módulo de segurança",
            "goal", "Verificar rate limiting",
            "depth", "QUICK",
            "outputMode", "REPORT_ONLY"
        );
    }

    @Test
    void rateLimitExceeded_after20Requests_returns429WithRetryAfter() throws Exception {
        String body = objectMapper.writeValueAsString(quickBody());

        // First 20 requests must succeed (202 or 422 — not 429)
        for (int i = 0; i < 20; i++) {
            int status = mockMvc.perform(post("/api/checkup/run")
                    .header("Authorization", TestJwtHelper.bearer(TOKEN))
                    .header("X-Organization-Id", RATE_TEST_ORG)
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(body))
                .andReturn().getResponse().getStatus();
            assertThat(status).as("Request %d should not be rate-limited", i + 1).isNotEqualTo(429);
        }

        // 21st request must be rate-limited
        mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TOKEN))
                .header("X-Organization-Id", RATE_TEST_ORG)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().is(429))
            .andExpect(header().string("Retry-After", "60"))
            .andExpect(jsonPath("$.error").value("RATE_LIMIT_EXCEEDED"));
    }

    @Test
    void rateLimitExceeded_auditEventRecorded() throws Exception {
        // Use a distinct user to avoid interference with other tests
        String userId = "user_rate_audit_" + System.nanoTime();
        String orgId = "org_rate_audit";
        String token = TestJwtHelper.validToken(userId, List.of(orgId));
        String body = objectMapper.writeValueAsString(quickBody());

        // Exhaust bucket
        for (int i = 0; i < 20; i++) {
            mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
        }

        // Trigger 429
        mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(token))
                .header("X-Organization-Id", orgId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(body))
            .andExpect(status().is(429));

        // Verify audit event was recorded
        Integer count = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_log WHERE user_id = ? AND event_type = 'RATE_LIMIT_EXCEEDED'",
            Integer.class, userId
        );
        assertThat(count).as("RATE_LIMIT_EXCEEDED audit event must be recorded").isGreaterThan(0);
    }
}
