package com.frankintest.api.system.ratelimit;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.audit.AuditService;
import com.frankintest.api.system.security.AuthenticatedPrincipal;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class RateLimitFilter extends OncePerRequestFilter {

    private static final int CAPACITY = 20;
    private static final Duration REFILL_PERIOD = Duration.ofMinutes(1);

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public RateLimitFilter(AuditService auditService, ObjectMapper objectMapper) {
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String userId = resolveUserId();
        if (userId == null) {
            // Should not reach here — JwtAuthFilter blocks unauthenticated requests first
            filterChain.doFilter(request, response);
            return;
        }

        Bucket bucket = buckets.computeIfAbsent(userId, id ->
            Bucket.builder()
                .addLimit(Bandwidth.builder()
                    .capacity(CAPACITY)
                    .refillGreedy(CAPACITY, REFILL_PERIOD)
                    .build())
                .build()
        );

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            tryRecordAudit(request, userId);
            response.setStatus(429);
            response.setHeader("Retry-After", "60");
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write(objectMapper.writeValueAsString(Map.of(
                "error", "RATE_LIMIT_EXCEEDED",
                "message", "Limite de requisições atingido. Tente novamente em breve."
            )));
        }
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/checkup/run") && !path.startsWith("/api/ai/");
    }

    private String resolveUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AuthenticatedPrincipal principal) {
            return principal.userId();
        }
        return null;
    }

    /** Clears all buckets. Called by integration tests to prevent bucket bleed across test methods. */
    public void resetBuckets() {
        buckets.clear();
    }

    private void tryRecordAudit(HttpServletRequest request, String userId) {
        try {
            auditService.record(AuditService.AuditEvent.of(
                "system", userId,
                "RATE_LIMIT_EXCEEDED",
                "ROUTE", request.getRequestURI(),
                "{}"
            ));
        } catch (Exception ignored) {
            // audit failure must not block the 429 response
        }
    }
}
