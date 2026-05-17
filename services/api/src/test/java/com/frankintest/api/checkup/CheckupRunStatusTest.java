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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckupRunStatusTest extends com.frankintest.api.BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private Map<String, Object> quickBody() {
        return Map.of(
            "targetType", "FEATURE_DESCRIPTION",
            "targetValue", "Formulário de cadastro",
            "userAuthorizationConfirmed", true,
            "context", "Módulo de cadastro de usuários de um SaaS B2B",
            "goal", "Identificar riscos de validação",
            "depth", "QUICK",
            "outputMode", "REPORT_ONLY"
        );
    }

    @Test
    void getRunStatus_completedRun_returns200WithReport() throws Exception {
        MvcResult runResult = mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quickBody())))
            .andExpect(status().isAccepted())
            .andReturn();

        String aiRunId = objectMapper.readTree(runResult.getResponse().getContentAsString())
            .get("aiRunId").asText();

        mockMvc.perform(get("/api/checkup/runs/" + aiRunId)
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.aiRunId").value(aiRunId))
            .andExpect(jsonPath("$.status").value("completed"))
            .andExpect(jsonPath("$.creditsConsumed").isNumber())
            .andExpect(jsonPath("$.report.status").value("DRAFT"))
            .andExpect(jsonPath("$.report.qualityRisks").isArray())
            .andExpect(jsonPath("$.report.qualityRisks[0]").exists())
            .andExpect(jsonPath("$.report.missingOrUnclearRequirements").isArray())
            .andExpect(jsonPath("$.report.suggestedTestScenarios").isArray())
            .andExpect(jsonPath("$.report.suggestedTestCases").isArray())
            .andExpect(jsonPath("$.report.uxProductRisks").isArray())
            .andExpect(jsonPath("$.report.releaseReadinessNotes").isArray())
            .andExpect(jsonPath("$.report.recommendedNextActions").isArray());
    }

    @Test
    void getRunStatus_unknownRunId_returns404() throws Exception {
        mockMvc.perform(get("/api/checkup/runs/nonexistent-run-id-xyz")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }
}
