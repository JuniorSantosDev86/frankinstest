package com.frankintest.api.system.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class DemoAuthModeTest {

    @Autowired private JwtService jwtService;

    @Test
    void generateDemoToken_producesValidatableToken() {
        String token = jwtService.generateDemoToken();
        assertThat(token).isNotBlank();

        AuthenticatedPrincipal principal = jwtService.parseToken(token);
        assertThat(principal.userId()).isEqualTo("user_demo_qa_lead");
        assertThat(principal.organizationIds()).contains("org_demo_personal");
    }

    @Test
    void parseToken_tokenSignedWithDifferentSecret_throwsInvalidTokenException() {
        // Build a token signed with a different secret (simulating prod env)
        io.jsonwebtoken.security.Keys.hmacShaKeyFor(
            "different-secret-simulating-prod-env-32c!!".getBytes(java.nio.charset.StandardCharsets.UTF_8)
        );

        String foreignToken = io.jsonwebtoken.Jwts.builder()
            .subject("user_demo_qa_lead")
            .claim("orgs", java.util.List.of("org_demo_personal"))
            .claim("roles", java.util.List.of("user"))
            .issuedAt(java.util.Date.from(java.time.Instant.now()))
            .expiration(java.util.Date.from(java.time.Instant.now().plusSeconds(3600)))
            .signWith(io.jsonwebtoken.security.Keys.hmacShaKeyFor(
                "different-secret-simulating-prod-env-32c!!".getBytes(java.nio.charset.StandardCharsets.UTF_8)
            ))
            .compact();

        assertThatThrownBy(() -> jwtService.parseToken(foreignToken))
            .isInstanceOf(JwtService.InvalidTokenException.class);
    }
}
