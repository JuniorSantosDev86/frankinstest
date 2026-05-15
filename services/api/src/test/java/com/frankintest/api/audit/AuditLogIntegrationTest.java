package com.frankintest.api.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuditLogIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private JdbcTemplate jdbc;

    @Test
    void generateScenarios_writesAuditEvents() throws Exception {
        String orgId = "org_audit_" + UUID.randomUUID();

        Map<String, Object> body = Map.of(
            "organizationId", orgId,
            "projectId", "proj_audit_test",
            "businessRuleId", "rule_audit_001",
            "confirmedEstimatedCredits", 30
        );

        mockMvc.perform(post("/api/ai/test-design/scenarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated());

        List<String> events = jdbc.queryForList(
            "SELECT event_type FROM audit_log WHERE organization_id = ? ORDER BY created_at",
            String.class, orgId
        );

        // ai_run.estimated is only written when /estimate endpoint is called separately
        assertThat(events).contains("credits.reserved", "ai_run.started",
            "credits.captured", "ai_run.completed");
        assertThat(events).anyMatch(e -> e.equals("artifact.ai_draft_created"));
    }

    @Test
    void auditService_recordEvent_persistsAllFields() {
        JdbcAuditService auditService = new JdbcAuditService(jdbc);
        String orgId = "org_auditunit_" + UUID.randomUUID();
        String entityId = UUID.randomUUID().toString();

        auditService.record(AuditService.AuditEvent.of(
            orgId, "user_001", "test_event", "test_scenario", entityId, "metadata=value"
        ));

        List<Map<String, Object>> rows = jdbc.queryForList(
            "SELECT * FROM audit_log WHERE organization_id = ? AND event_type = 'test_event'",
            orgId
        );

        assertThat(rows).hasSize(1);
        Map<String, Object> row = rows.get(0);
        assertThat(row.get("user_id")).isEqualTo("user_001");
        assertThat(row.get("entity_type")).isEqualTo("test_scenario");
        assertThat(row.get("entity_id")).isEqualTo(entityId);
        assertThat(row.get("metadata")).isEqualTo("metadata=value");
    }
}
