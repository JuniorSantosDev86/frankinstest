package com.frankintest.api.system;

import java.time.Instant;

public record SystemHealthResponse(
        String status,
        String service,
        String version,
        Instant timestamp
) {}
