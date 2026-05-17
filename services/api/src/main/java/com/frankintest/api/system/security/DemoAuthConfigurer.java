package com.frankintest.api.system.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnProperty(name = "demo-auth.enabled", havingValue = "true")
public class DemoAuthConfigurer {

    private static final Logger log = LoggerFactory.getLogger(DemoAuthConfigurer.class);

    private final JwtService jwtService;

    public DemoAuthConfigurer(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @EventListener(ApplicationReadyEvent.class)
    public void onApplicationReady() {
        String token = jwtService.generateDemoToken();
        log.info("[DEMO] JWT token for local dev (dev mode only): {}", token);
        log.warn("[DEMO] This token is NOT valid in production. Set DEMO_AUTH_ENABLED=false to disable.");
    }
}
