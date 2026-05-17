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
class JwtAuthFilterTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private String anyBody() throws Exception {
        return objectMapper.writeValueAsString(Map.of(
            "targetType", "FEATURE_DESCRIPTION",
            "targetValue", "Sistema de auth",
            "userAuthorizationConfirmed", true,
            "context", "Contexto de teste de filtro JWT",
            "goal", "Validar filtro",
            "depth", "QUICK",
            "outputMode", "REPORT_ONLY"
        ));
    }

    @Test
    void missingAuthorizationHeader_returns401WithSafeBody() throws Exception {
        mockMvc.perform(post("/api/checkup/estimate")
                .contentType(MediaType.APPLICATION_JSON)
                .content(anyBody()))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.message").value("Autenticação necessária."));
    }

    @Test
    void malformedToken_returns401WithSafeBody() throws Exception {
        mockMvc.perform(post("/api/checkup/estimate")
                .header("Authorization", "Bearer not.a.valid.jwt")
                .contentType(MediaType.APPLICATION_JSON)
                .content(anyBody()))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.message").value("Autenticação necessária."));
    }

    @Test
    void expiredToken_returns401WithSafeBodyNotLeakingExpiry() throws Exception {
        mockMvc.perform(post("/api/checkup/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.expiredToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(anyBody()))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.error").value("UNAUTHORIZED"))
            .andExpect(jsonPath("$.message").value("Autenticação necessária."));
    }

    @Test
    void validToken_populatesSecurityContext_proceeds() throws Exception {
        // With valid token and correct org, request reaches the controller
        // (returns 200 or 422 — both prove auth passed)
        mockMvc.perform(post("/api/checkup/estimate")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(anyBody()))
            .andExpect(result -> {
                int status = result.getResponse().getStatus();
                org.assertj.core.api.Assertions.assertThat(status)
                    .as("Expected 200 or 422, not 401")
                    .isIn(200, 422);
            });
    }
}
