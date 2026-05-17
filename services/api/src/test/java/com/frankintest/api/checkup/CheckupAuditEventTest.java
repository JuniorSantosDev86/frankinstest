package com.frankintest.api.checkup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckupAuditEventTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbc;

    private Map<String, Object> quickBody() {
        return Map.of(
            "targetType", "FEATURE_DESCRIPTION",
            "targetValue", "Sistema de notificações push",
            "userAuthorizationConfirmed", true,
            "context", "Módulo de notificações de um app mobile de delivery",
            "goal", "Verificar riscos de entrega de notificações",
            "depth", "QUICK",
            "outputMode", "REPORT_ONLY"
        );
    }

    @Test
    void run_success_recordsCheckUpRequestedAuditEvent() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/checkup/run")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quickBody())))
            .andExpect(status().isAccepted())
            .andReturn();

        String aiRunId = objectMapper.readTree(result.getResponse().getContentAsString())
            .get("aiRunId").asText();

        List<String> events = jdbc.queryForList(
            "SELECT event_type FROM audit_log WHERE entity_id = ? ORDER BY created_at",
            String.class, aiRunId
        );

        assertThat(events).contains("CHECK_UP_REQUESTED");
        assertThat(events).contains("CHECK_UP_CREDITS_RESERVED");
        assertThat(events).contains("CHECK_UP_RUNNING");
        // COMPLETED or FAILED depending on mock output
        assertThat(events).anyMatch(e -> e.equals("CHECK_UP_COMPLETED") || e.equals("CHECK_UP_FAILED"));
    }

    @Test
    void run_authorizationFalse_noAuditEventCreated() throws Exception {
        var body = new java.util.HashMap<>(quickBody());
        body.put("userAuthorizationConfirmed", false);

        long countBefore = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_log WHERE event_type = 'CHECK_UP_REQUESTED'",
            Long.class
        );

        mockMvc.perform(post("/api/checkup/run")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isUnprocessableEntity());

        long countAfter = jdbc.queryForObject(
            "SELECT COUNT(*) FROM audit_log WHERE event_type = 'CHECK_UP_REQUESTED'",
            Long.class
        );

        assertThat(countAfter).isEqualTo(countBefore);
    }
}
