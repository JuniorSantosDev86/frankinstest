package com.frankintest.api.system;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class SystemHealthService {

    @Value("${spring.application.name}")
    private String serviceName;

    @Value("${app.version}")
    private String version;

    public SystemHealthResponse getHealth() {
        return new SystemHealthResponse("UP", serviceName, version, Instant.now());
    }
}
