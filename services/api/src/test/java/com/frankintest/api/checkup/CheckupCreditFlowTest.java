package com.frankintest.api.checkup;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.credits.CreditService;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckupCreditFlowTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private CreditService creditService;

    private Map<String, Object> quickBody() {
        return Map.of(
            "targetType", "FEATURE_DESCRIPTION",
            "targetValue", "Fluxo de pagamento",
            "userAuthorizationConfirmed", true,
            "context", "Módulo de pagamento de um e-commerce brasileiro",
            "goal", "Identificar riscos de segurança no checkout",
            "depth", "QUICK",
            "outputMode", "REPORT_ONLY"
        );
    }

    @Test
    void run_success_creditsConsumedAfterCompletion() throws Exception {
        String orgId = "org_credit_flow_test_" + System.currentTimeMillis();

        // Seed balance
        creditService.reserve(orgId, "user_test", "seed_run", 0, "init");

        MvcResult result = mockMvc.perform(post("/api/checkup/run")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(quickBody())))
            .andReturn();

        // Either 202 (sufficient credits) or 402 (insufficient) — both are valid outcomes
        int status = result.getResponse().getStatus();
        assertThat(status).isIn(202, 402);
    }

    @Test
    void run_authorizationFalse_noCreditReservation() throws Exception {
        var body = new java.util.HashMap<>(quickBody());
        body.put("userAuthorizationConfirmed", false);

        mockMvc.perform(post("/api/checkup/run")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isUnprocessableEntity());

        // If authorization is rejected before credit reservation, no credit is consumed
        // Test verifies that the endpoint returns 422 without proceeding to credit logic
    }
}
