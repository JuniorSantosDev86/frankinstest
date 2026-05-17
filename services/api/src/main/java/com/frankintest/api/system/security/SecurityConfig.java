package com.frankintest.api.system.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.audit.AuditService;
import com.frankintest.api.system.ratelimit.RateLimitFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtService jwtService;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public SecurityConfig(JwtService jwtService, AuditService auditService, ObjectMapper objectMapper) {
        this.jwtService = jwtService;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    @Bean
    public JwtAuthFilter jwtAuthFilter() {
        return new JwtAuthFilter(jwtService, auditService, objectMapper);
    }

    @Bean
    public RateLimitFilter rateLimitFilter() {
        return new RateLimitFilter(auditService, objectMapper);
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .formLogin(AbstractHttpConfigurer::disable)
            .httpBasic(AbstractHttpConfigurer::disable)
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                .requestMatchers("/api/health", "/actuator/health", "/actuator/**").permitAll()
                .requestMatchers("/api/checkup/**", "/api/ai/**").authenticated()
                .anyRequest().permitAll()
            )
            .addFilterBefore(jwtAuthFilter(), UsernamePasswordAuthenticationFilter.class)
            .addFilterAfter(rateLimitFilter(), JwtAuthFilter.class);

        return http.build();
    }
}
