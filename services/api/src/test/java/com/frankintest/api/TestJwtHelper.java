package com.frankintest.api;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.List;

/**
 * Generates signed JWTs for integration tests using the test-profile secret.
 */
public class TestJwtHelper {

    public static final String TEST_SECRET = "test-secret-for-unit-tests-must-be-32-chars-ok!!";
    public static final String DEMO_USER_ID = "user_demo_qa_lead";
    public static final String DEMO_ORG_ID = "org_demo_personal";
    public static final String OTHER_ORG_ID = "org_other";

    private static final SecretKey KEY =
        Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));

    public static String validToken() {
        return validToken(DEMO_USER_ID, List.of(DEMO_ORG_ID));
    }

    public static String validToken(String userId, List<String> orgIds) {
        Instant now = Instant.now();
        return Jwts.builder()
            .subject(userId)
            .claim("orgs", orgIds)
            .claim("roles", List.of("user"))
            .issuedAt(Date.from(now))
            .expiration(Date.from(now.plusSeconds(3600)))
            .signWith(KEY)
            .compact();
    }

    public static String expiredToken() {
        Instant past = Instant.now().minusSeconds(7200);
        return Jwts.builder()
            .subject(DEMO_USER_ID)
            .claim("orgs", List.of(DEMO_ORG_ID))
            .claim("roles", List.of("user"))
            .issuedAt(Date.from(past))
            .expiration(Date.from(past.plusSeconds(1)))
            .signWith(KEY)
            .compact();
    }

    public static String bearer(String token) {
        return "Bearer " + token;
    }
}
