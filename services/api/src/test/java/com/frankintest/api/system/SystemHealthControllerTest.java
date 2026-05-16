package com.frankintest.api.system;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.Instant;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

class SystemHealthControllerTest {

    @Test
    void health_returnsOkWithExpectedFields() throws Exception {
        MockMvc mockMvc = MockMvcBuilders
            .standaloneSetup(new SystemHealthController(new FixedHealthService()))
            .build();

        mockMvc.perform(get("/api/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"))
                .andExpect(jsonPath("$.service").value("frankintest-api"))
                .andExpect(jsonPath("$.version").value("0.1.0"))
                .andExpect(jsonPath("$.timestamp").exists());
    }

    private static class FixedHealthService extends SystemHealthService {
        @Override
        public SystemHealthResponse getHealth() {
            return new SystemHealthResponse(
                "UP", "frankintest-api", "0.1.0", Instant.parse("2026-05-14T10:00:00Z"));
        }
    }
}
