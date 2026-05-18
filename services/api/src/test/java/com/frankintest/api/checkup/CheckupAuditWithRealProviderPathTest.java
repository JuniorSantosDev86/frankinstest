package com.frankintest.api.checkup;

import com.fasterxml.jackson.databind.JsonNode;
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
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckupAuditWithRealProviderPathTest extends com.frankintest.api.BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private JdbcTemplate jdbc;

    private Map<String, Object> runBody() {
        return Map.of(
            "targetType", "FEATURE_DESCRIPTION",
            "targetValue", "Fluxo de autenticação com JWT",
            "userAuthorizationConfirmed", true,
            "context", "API REST de um SaaS B2B",
            "goal", "Verificar riscos de segurança no login",
            "depth", "QUICK",
            "outputMode", "REPORT_ONLY"
        );
    }

    @Test
    void successfulRun_emitsProviderCallAuditEvents() throws Exception {
        MvcResult runResult = mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(runBody())))
            .andExpect(status().isAccepted())
            .andReturn();

        String aiRunId = objectMapper.readTree(runResult.getResponse().getContentAsString())
            .get("aiRunId").asText();

        List<String> events = jdbc.queryForList(
            "SELECT event_type FROM audit_log WHERE entity_id = ? ORDER BY created_at",
            String.class, aiRunId
        );

        assertThat(events).contains("CHECK_UP_PROVIDER_CALL_STARTED");
        assertThat(events).contains("CHECK_UP_PROVIDER_CALL_COMPLETED");
        assertThat(events).contains("CHECK_UP_RUNNING");
        assertThat(events).contains("CHECK_UP_COMPLETED");
    }

    @Test
    void successfulRun_reportContainsAiAssistedTrue() throws Exception {
        MvcResult runResult = mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(runBody())))
            .andExpect(status().isAccepted())
            .andReturn();

        String aiRunId = objectMapper.readTree(runResult.getResponse().getContentAsString())
            .get("aiRunId").asText();

        MvcResult statusResult = mockMvc.perform(get("/api/checkup/runs/" + aiRunId)
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode body = objectMapper.readTree(statusResult.getResponse().getContentAsString());
        assertThat(body.path("status").asText()).isEqualTo("completed");

        JsonNode report = body.path("report");
        assertThat(report.isMissingNode()).isFalse();
        assertThat(report.path("aiAssisted").asBoolean()).isTrue();
    }
}
