package com.frankintest.api.system.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.demo-ttl-seconds:86400}")
    private long demoTtlSeconds;

    private SecretKey signingKey;

    @PostConstruct
    void init() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            throw new IllegalStateException(
                "jwt.secret must be at least 32 characters (256 bits). Current length: " + keyBytes.length);
        }
        signingKey = Keys.hmacShaKeyFor(keyBytes);
    }

    public String generateToken(String userId, List<String> organizationIds, List<String> roles, long ttlSeconds) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(userId)
            .claim("orgs", organizationIds)
            .claim("roles", roles)
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(ttlSeconds)))
            .signWith(signingKey)
            .compact();
    }

    public String generateDemoToken() {
        return generateToken(
            "user_demo_qa_lead",
            List.of("org_demo_personal"),
            List.of("user"),
            demoTtlSeconds
        );
    }

    public AuthenticatedPrincipal parseToken(String raw) {
        try {
            Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(raw)
                .getPayload();

            String userId = claims.getSubject();
            @SuppressWarnings("unchecked")
            List<String> orgs = claims.get("orgs", List.class);
            @SuppressWarnings("unchecked")
            List<String> roles = claims.get("roles", List.class);

            return new AuthenticatedPrincipal(
                userId,
                orgs != null ? orgs : List.of(),
                roles != null ? roles : List.of()
            );
        } catch (JwtException | IllegalArgumentException e) {
            throw new InvalidTokenException("Token inválido ou expirado", e);
        }
    }

    public static class InvalidTokenException extends RuntimeException {
        public InvalidTokenException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
