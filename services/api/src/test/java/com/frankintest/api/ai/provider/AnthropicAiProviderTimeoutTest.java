package com.frankintest.api.ai.provider;

import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.net.ServerSocket;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;

class AnthropicAiProviderTimeoutTest {

    @Test
    void generate_timeoutOccurs_returnsFailureWithoutStackTrace() throws IOException {
        // Start a local server that accepts connections but never responds
        try (ServerSocket server = new ServerSocket(0)) {
            int port = server.getLocalPort();
            ExecutorService accept = Executors.newSingleThreadExecutor();
            accept.submit(() -> {
                try {
                    // Accept but never write anything — triggers timeout
                    server.accept();
                } catch (IOException ignored) {}
            });

            AnthropicAiProvider provider = new AnthropicAiProvider(
                "sk-ant-fake-key-for-timeout-test",
                "claude-haiku-4-5-20251001",
                4096,
                "http://localhost:" + port,
                "2023-06-01",
                1  // 1 second timeout
            );

            AiProviderPort.AiProviderResponse response = provider.generate("test prompt");

            assertThat(response.success()).isFalse();
            assertThat(response.errorMessage()).isNotBlank();
            // No stack trace text and no provider secrets in message
            assertThat(response.errorMessage()).doesNotContain("Exception");
            assertThat(response.errorMessage()).doesNotContain("at com.");
            assertThat(response.errorMessage()).doesNotContain("sk-ant");

            accept.shutdownNow();
        }
    }
}
