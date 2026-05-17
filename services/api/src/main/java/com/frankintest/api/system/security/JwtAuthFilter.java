package com.frankintest.api.system.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.audit.AuditService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;

public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public JwtAuthFilter(JwtService jwtService, AuditService auditService, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain) throws ServletException, IOException {
        String header = request.getHeader("Authorization");

        if (header == null || !header.startsWith("Bearer ")) {
            recordAndReject(request, response, "missing");
            return;
        }

        String token = header.substring(7);
        try {
            AuthenticatedPrincipal principal = jwtService.parseToken(token);
            var auth = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                principal.roles().stream()
                    .map(r -> new SimpleGrantedAuthority("ROLE_" + r.toUpperCase()))
                    .toList()
            );
            SecurityContextHolder.getContext().setAuthentication(auth);
            filterChain.doFilter(request, response);
        } catch (JwtService.InvalidTokenException e) {
            recordAndReject(request, response, "invalid");
        }
    }

    private void recordAndReject(HttpServletRequest request, HttpServletResponse response, String reason)
            throws IOException {
        SecurityContextHolder.clearContext();
        tryRecordAudit(request, reason);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(Map.of(
            "error", "UNAUTHORIZED",
            "message", "Autenticação necessária."
        )));
    }

    private void tryRecordAudit(HttpServletRequest request, String reason) {
        try {
            auditService.record(AuditService.AuditEvent.of(
                "system", "anonymous",
                "SECURITY_401",
                "ROUTE", request.getRequestURI(),
                "{\"reason\":\"" + reason + "\"}"
            ));
        } catch (Exception ignored) {
            // audit failure must not block the 401 response
        }
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();
        return "OPTIONS".equalsIgnoreCase(method)
            || path.equals("/api/health")
            || path.startsWith("/actuator/");
    }
}
