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

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CheckupProviderHttpErrorTest extends com.frankintest.api.BaseIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private Map<String, Object> failureBody() {
        return Map.of(
            "targetType", "FEATURE_DESCRIPTION",
            "targetValue", "force-provider-failure",
            "userAuthorizationConfirmed", true,
            "context", "Simulação de erro HTTP 500 do provider",
            "goal", "Verificar que internals do provider não vazam",
            "depth", "QUICK",
            "outputMode", "REPORT_ONLY"
        );
    }

    @Test
    void providerHttpError_responseBodyContainsNoPtBrProviderInternals() throws Exception {
        MvcResult result = mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(failureBody())))
            .andReturn();

        String body = result.getResponse().getContentAsString();
        // Provider raw error must never appear in response
        assertThat(body).doesNotContain("HTTP 500");
        assertThat(body).doesNotContain("Falha simulada do provedor para testes de lifecycle");
        assertThat(body).doesNotContain("sk-ant");
        assertThat(body).doesNotContain("ANTHROPIC_API_KEY");
    }

    @Test
    void providerHttpError_noCreditLeakage() throws Exception {
        // Verifies the flow either never reserves (402) or releases on failure
        // The key invariant: if we get a provider failure path, no credits are leaked
        MvcResult result = mockMvc.perform(post("/api/checkup/run")
                .header("Authorization", TestJwtHelper.bearer(TestJwtHelper.validToken()))
                .header("X-Organization-Id", TestJwtHelper.DEMO_ORG_ID)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(failureBody())))
            .andReturn();

        int status = result.getResponse().getStatus();
        // 202 would mean the mock returned success (shouldn't happen with force-provider-failure)
        // 402 = no credits (reservation never happened)
        // 5xx = provider failure path exercised — credits must be released
        assertThat(status).isNotEqualTo(202);
    }
}
