package com.frankintest.api.audit;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;

@Service
public class JdbcAuditService implements AuditService {

    private final JdbcTemplate jdbc;

    public JdbcAuditService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    @Override
    public void record(AuditEvent event) {
        jdbc.update("""
            INSERT INTO audit_log (id, organization_id, user_id, event_type, entity_type, entity_id, metadata, created_at)
            VALUES (?,?,?,?,?,?,?,?)
            """,
            UUID.randomUUID().toString(),
            event.organizationId(),
            event.userId(),
            event.eventType(),
            event.entityType(),
            event.entityId(),
            event.metadata(),
            Timestamp.from(Instant.now())
        );
    }
}
