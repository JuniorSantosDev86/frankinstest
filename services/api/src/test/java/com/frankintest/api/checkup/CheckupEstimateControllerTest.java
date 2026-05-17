package com.frankintest.api.checkup;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckupEstimateControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private Map<String, Object> validBody() {
        return Map.of(
            "targetType", "FEATURE_DESCRIPTION",
            "targetValue", "Sistema de login com email e senha",
            "userAuthorizationConfirmed", true,
            "context", "Módulo de autenticação de um SaaS de gestão de projetos",
            "goal", "Identificar riscos de segurança",
            "depth", "STANDARD",
            "outputMode", "REPORT_WITH_SCENARIOS"
        );
    }

    @Test
    void estimate_validRequest_returns200WithCreditsAndBreakdown() throws Exception {
        mockMvc.perform(post("/api/checkup/estimate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validBody())))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.estimatedCredits").value(30))
            .andExpect(jsonPath("$.breakdown.base").value(20))
            .andExpect(jsonPath("$.breakdown.outputMultiplier").value(1.5))
            .andExpect(jsonPath("$.currency").value("credits"));
    }

    @Test
    void estimate_authorizationNotConfirmed_returns422() throws Exception {
        var body = new java.util.HashMap<>(validBody());
        body.put("userAuthorizationConfirmed", false);

        mockMvc.perform(post("/api/checkup/estimate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isUnprocessableEntity())
            .andExpect(jsonPath("$.error").value("AUTHORIZATION_REQUIRED"));
    }

    @Test
    void estimate_contextTooShort_returns400() throws Exception {
        var body = new java.util.HashMap<>(validBody());
        body.put("context", "Curto");

        mockMvc.perform(post("/api/checkup/estimate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"))
            .andExpect(jsonPath("$.field").value("context"));
    }

    @Test
    void estimate_missingRequiredField_returns400() throws Exception {
        var body = new java.util.HashMap<>(validBody());
        body.remove("goal");

        mockMvc.perform(post("/api/checkup/estimate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
            .andExpect(status().isBadRequest());
    }
}
