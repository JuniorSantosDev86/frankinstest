package com.frankintest.api.system;

import com.frankintest.api.system.security.AuthenticatedPrincipal;
import org.springframework.stereotype.Service;

@Service
public class WorkspaceAccessService {

    /**
     * Validates that the declared organizationId belongs to the authenticated principal.
     * Validation uses the JWT organizationIds claim — the static demo mapping is only
     * used at demo token generation time, not here.
     *
     * @throws MissingOrgHeaderException if organizationId is blank
     * @throws AccessDeniedException     if organizationId is not in the principal's allowed orgs
     */
    public void requireOrgAccess(AuthenticatedPrincipal principal, String organizationId) {
        if (organizationId == null || organizationId.isBlank()) {
            throw new MissingOrgHeaderException("X-Organization-Id é obrigatório.");
        }
        if (!principal.organizationIds().contains(organizationId)) {
            throw new AccessDeniedException("Acesso negado a este recurso.");
        }
    }

    public void requireProjectAccess(String organizationId, String projectId, String userId) {
        if (organizationId == null || organizationId.isBlank()) {
            throw new AccessDeniedException("organizationId é obrigatório");
        }
        if (projectId == null || projectId.isBlank()) {
            throw new AccessDeniedException("projectId é obrigatório");
        }
        if (userId == null || userId.isBlank()) {
            throw new AccessDeniedException("userId é obrigatório");
        }
    }

    public static class MissingOrgHeaderException extends RuntimeException {
        public MissingOrgHeaderException(String message) {
            super(message);
        }
    }

    public static class AccessDeniedException extends RuntimeException {
        public AccessDeniedException(String message) {
            super(message);
        }
    }
}
