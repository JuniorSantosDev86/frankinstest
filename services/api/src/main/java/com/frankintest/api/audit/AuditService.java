package com.frankintest.api.audit;

public interface AuditService {

    void record(AuditEvent event);

    record AuditEvent(
        String organizationId,
        String userId,
        String eventType,
        String entityType,
        String entityId,
        String metadata
    ) {
        public static AuditEvent of(
            String organizationId, String userId,
            String eventType, String entityType, String entityId,
            String metadata
        ) {
            return new AuditEvent(organizationId, userId, eventType, entityType, entityId, metadata);
        }
    }
}
