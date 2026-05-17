package com.frankintest.api.system.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.TestJwtHelper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckupAuthProtectionTest extends com.frankintest.api.BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private Map<String, Object> validBody() {
        return Map.of(
            "targetType", "FEATURE_DESCRIPTION",
            "targetValue", "Sistema de login com email e senha",
            "userAuthorizationConfirmed", true,
            "context", "Módulo de autenticação de um SaaS de gestão de projetos",
            "goal", "Validar segurança do sistema",
            "depth", "QUICK",
            "outputMode", "REPORT_ONLY"
        );
    }

    @Test
    void estimate_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/checkup/estimate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validBody())))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"));
    }

    @Test
    void estimate_expiredToken_returns401WithSafeBody() throws Exception {
        mockMvc.perform(post("/api/checkup/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.expiredToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validBody())))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.message").value("Autenticação necessária."));
    }

    @Test
    void estimate_validTokenCorrectOrg_proceeds() throws Exception {
        // Expects 200 (credit estimate) or 422 (authorization not confirmed) — not 401/403
        mockMvc.perform(post("/api/checkup/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validBody())))
            .andExpect(result -> {
                int status = result.getResponse().getStatus();
                org.assertj.core.api.Assertions.assertThat(status)
                    .as("Expected 200 or 422, got %d", status)
                    .isIn(200, 422);
            });
    }

    @Test
    void estimate_validTokenWrongOrg_returns403() throws Exception {
        mockMvc.perform(post("/api/checkup/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.OTHER_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validBody())))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }

    @Test
    void estimate_validTokenMissingOrgHeader_returns400() throws Exception {
        mockMvc.perform(post("/api/checkup/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validBody())))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.error").value("VALIDATION_ERROR"));
    }

    @Test
    void run_noToken_returns401() throws Exception {
        mockMvc.perform(post("/api/checkup/run")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validBody())))
            .andExpect(status().isUnauthorized());
    }

    @Test
    void run_validTokenWrongOrg_returns403() throws Exception {
        mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.OTHER_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(validBody())))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.error").value("FORBIDDEN"));
    }
}
