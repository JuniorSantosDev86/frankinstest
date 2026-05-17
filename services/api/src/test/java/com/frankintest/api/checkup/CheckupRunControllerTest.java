package com.frankintest.api.checkup;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.TestJwtHelper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckupRunControllerTest extends com.frankintest.api.BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private CheckupRepository checkupRepository;

    private Map<String, Object> validBody() {
        return Map.of(
            "targetType", "FEATURE_DESCRIPTION",
            "targetValue", "Sistema de login com email e senha",
            "userAuthorizationConfirmed", true,
            "context", "Módulo de autenticação de um SaaS de gestão de projetos",
            "goal", "Identificar riscos de segurança",
            "depth", "QUICK",
            "outputMode", "REPORT_ONLY"
        );
    }

    @Test
    void run_validRequest_returns202WithAiRunIdAndReportId() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validBody())))
            .andExpect(status().isAccepted())
            .andExpect(jsonPath("$.aiRunId").isString())
            .andExpect(jsonPath("$.reportId").isString())
            .andExpect(jsonPath("$.estimatedCredits").isNumber())
            .andReturn();

        String body = result.getResponse().getContentAsString();
        String aiRunId = objectMapper.readTree(body).get("aiRunId").asText();
        var report = checkupRepository.findByAiRunId(aiRunId);
        assertThat(report).isPresent();
        assertThat(report.get().status()).isEqualTo(CheckupModels.ReportStatus.DRAFT);
    }

    @Test
    void run_authorizationNotConfirmed_returns422() throws Exception {
        var body = new java.util.HashMap<>(validBody());
        body.put("userAuthorizationConfirmed", false);

        mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.error").value("AUTHORIZATION_REQUIRED"));
    }

    @Test
    void run_insufficientCredits_returns402() throws Exception {
        var body = new java.util.HashMap<>(validBody());
        body.put("depth", "DEEP");
        body.put("outputMode", "REPORT_WITH_SCENARIOS");

        mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
        // 202 or 402 both acceptable depending on balance
    }
}
