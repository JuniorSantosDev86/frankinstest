package com.frankintest.api.system;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CorsConfigTest {

    @Autowired private MockMvc mockMvc;

    @Test
    void preflight_fromAllowedOrigin_hasCorsHeaders() throws Exception {
        mockMvc.perform(options("/api/checkup/estimate")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Content-Type,Authorization,X-Organization-Id"))
            .andExpect(status().isOk())
            .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:3000"));
    }

    @Test
    void preflight_fromUnallowedOrigin_noCorsAllowOriginHeader() throws Exception {
        mockMvc.perform(options("/api/checkup/estimate")
                .header("Origin", "http://evil.example.com")
                .header("Access-Control-Request-Method", "POST"))
            .andExpect(result -> {
                String allowOrigin = result.getResponse().getHeader("Access-Control-Allow-Origin");
                org.assertj.core.api.Assertions.assertThat(allowOrigin)
                    .as("Unauthorized origin must not receive Access-Control-Allow-Origin")
                    .isNull();
            });
    }

    @Test
    void preflight_allowedHeadersIncludeAuthAndOrgId() throws Exception {
        mockMvc.perform(options("/api/checkup/estimate")
                .header("Origin", "http://localhost:3000")
                .header("Access-Control-Request-Method", "POST")
                .header("Access-Control-Request-Headers", "Authorization,X-Organization-Id"))
            .andExpect(status().isOk())
            .andExpect(result -> {
                String allowedHeaders = result.getResponse()
                    .getHeader("Access-Control-Allow-Headers");
                org.assertj.core.api.Assertions.assertThat(allowedHeaders)
                    .as("CORS preflight must allow Authorization and X-Organization-Id headers")
                    .containsIgnoringCase("Authorization")
                    .containsIgnoringCase("X-Organization-Id");
            });
    }
}
