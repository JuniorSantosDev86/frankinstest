package com.frankintest.api.checkup;

import com.fasterxml.jackson.databind.ObjectMapper;
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
class CheckupRunStatusTest {

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
        // First run a checkup to get an aiRunId
        MvcResult runResult = mockMvc.perform(post("/api/checkup/run")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quickBody())))
            .andExpect(status().isAccepted())
            .andReturn();

        String aiRunId = objectMapper.readTree(runResult.getResponse().getContentAsString())
            .get("aiRunId").asText();

        // Poll status — with MockAiProvider it completes synchronously
        mockMvc.perform(get("/api/checkup/runs/" + aiRunId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.aiRunId").value(aiRunId))
            .andExpect(jsonPath("$.status").value("completed"))
            .andExpect(jsonPath("$.creditsConsumed").isNumber())
            .andExpect(jsonPath("$.report.status").value("DRAFT"))
            .andExpect(jsonPath("$.report.qualityRisks").isArray())
            .andExpect(jsonPath("$.report.qualityRisks[0]").exists())
            .andExpect(jsonPath("$.report.missingOrUnclearRequirements").isArray())
            .andExpect(jsonPath("$.report.missingOrUnclearRequirements[0]").exists())
            .andExpect(jsonPath("$.report.suggestedTestScenarios").isArray())
            .andExpect(jsonPath("$.report.suggestedTestScenarios[0]").exists())
            .andExpect(jsonPath("$.report.suggestedTestCases").isArray())
            .andExpect(jsonPath("$.report.suggestedTestCases[0]").exists())
            .andExpect(jsonPath("$.report.uxProductRisks").isArray())
            .andExpect(jsonPath("$.report.uxProductRisks[0]").exists())
            .andExpect(jsonPath("$.report.releaseReadinessNotes").isArray())
            .andExpect(jsonPath("$.report.releaseReadinessNotes[0]").exists())
            .andExpect(jsonPath("$.report.recommendedNextActions").isArray())
            .andExpect(jsonPath("$.report.recommendedNextActions[0]").exists());
    }

    @Test
    void getRunStatus_unknownRunId_returns404() throws Exception {
        mockMvc.perform(get("/api/checkup/runs/nonexistent-run-id-xyz"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.error").value("NOT_FOUND"));
    }
}
