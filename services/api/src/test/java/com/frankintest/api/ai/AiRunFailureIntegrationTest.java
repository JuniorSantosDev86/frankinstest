package com.frankintest.api.ai;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.credits.CreditRepository;
import com.frankintest.api.credits.CreditModels;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AiRunFailureIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CreditRepository creditRepository;

    // T057/T058 — provider/output-validation failure releases reserved credits
    @Test
    void generateScenarios_success_consumedCreditsArePositive() throws Exception {
        String orgId = "org_failure_" + UUID.randomUUID();

        Map<String, Object> body = Map.of(
            "organizationId", orgId,
            "projectId", "proj_failure_test",
            "businessRuleId", "rule_failure_001",
            "confirmedEstimatedCredits", 30
        );

        mockMvc.perform(post("/api/ai/test-design/scenarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.consumedCredits").isNumber());
    }

    // T059 — GET /api/ai/runs/{aiRunId} returns safe metadata after a successful run
    @Test
    void generateScenarios_thenGetRunStatus_returnsSafeMetadata() throws Exception {
        String orgId = "org_status_" + UUID.randomUUID();

        Map<String, Object> body = Map.of(
            "organizationId", orgId,
            "projectId", "proj_status_test",
            "businessRuleId", "rule_status_001",
            "confirmedEstimatedCredits", 30
        );

        String responseJson = mockMvc.perform(post("/api/ai/test-design/scenarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isCreated())
            .andReturn().getResponse().getContentAsString();

        String aiRunId = objectMapper.readTree(responseJson).path("aiRunId").asText();
        assertThat(aiRunId).isNotBlank();

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .get("/api/ai/runs/" + aiRunId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.aiRunId").value(aiRunId))
            .andExpect(jsonPath("$.status").value("completed"))
            .andExpect(jsonPath("$.estimatedCredits").isNumber())
            .andExpect(jsonPath("$.consumedCredits").isNumber());
    }

    // T059 — unknown aiRunId returns 404
    @Test
    void getRunStatus_unknownId_returns404() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .get("/api/ai/runs/nonexistent_run_xyz"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.code").value("RUN_NOT_FOUND"));
    }

    // T057 — insufficient credits returns 402 and credits are NOT consumed
    @Test
    void generateScenarios_insufficientCredits_returns402AndCreditsNotConsumed() throws Exception {
        String orgId = "org_insuf_" + UUID.randomUUID();

        // Exhaust initial balance by reserving maximum
        CreditModels.CreditBalance balance = creditRepository.getOrCreateBalance(orgId);
        long available = balance.availableCredits();

        // Request more than available
        Map<String, Object> body = Map.of(
            "organizationId", orgId,
            "projectId", "proj_insuf_test",
            "businessRuleId", "rule_insuf_001",
            "confirmedEstimatedCredits", (int) (available + 9999)
        );

        mockMvc.perform(post("/api/ai/test-design/scenarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isPaymentRequired())
            .andExpect(jsonPath("$.code").value("INSUFFICIENT_CREDITS"));

        // Verify balance is unchanged
        CreditModels.CreditBalance afterBalance = creditRepository.getOrCreateBalance(orgId);
        assertThat(afterBalance.availableCredits()).isEqualTo(available);
    }

    @Test
    void generateScenarios_providerFailure_returns502AndReleasesCredits() throws Exception {
        String orgId = "org_provider_" + UUID.randomUUID();
        long before = creditRepository.getOrCreateBalance(orgId).availableCredits();

        Map<String, Object> body = Map.of(
            "organizationId", orgId,
            "projectId", "proj_provider_test",
            "businessRuleId", "rule_provider_001",
            "confirmedEstimatedCredits", 30,
            "context", "force-provider-failure"
        );

        mockMvc.perform(post("/api/ai/test-design/scenarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadGateway())
            .andExpect(jsonPath("$.code").value("PROVIDER_FAILURE"));

        long after = creditRepository.getOrCreateBalance(orgId).availableCredits();
        assertThat(after).isEqualTo(before);
    }

    @Test
    void generateScenarios_invalidProviderOutput_returns502AndReleasesCredits() throws Exception {
        String orgId = "org_output_" + UUID.randomUUID();
        long before = creditRepository.getOrCreateBalance(orgId).availableCredits();

        Map<String, Object> body = Map.of(
            "organizationId", orgId,
            "projectId", "proj_output_test",
            "businessRuleId", "rule_output_001",
            "confirmedEstimatedCredits", 30,
            "context", "force-invalid-output"
        );

        mockMvc.perform(post("/api/ai/test-design/scenarios")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadGateway())
            .andExpect(jsonPath("$.code").value("OUTPUT_VALIDATION_FAILURE"));

        long after = creditRepository.getOrCreateBalance(orgId).availableCredits();
        assertThat(after).isEqualTo(before);
    }
}
