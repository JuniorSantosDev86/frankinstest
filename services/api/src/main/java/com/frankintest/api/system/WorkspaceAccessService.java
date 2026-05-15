package com.frankintest.api.system;

import org.springframework.stereotype.Service;

/**
 * Foundation for org/project access validation.
 * Full auth enforcement is deferred; methods are shaped for future production auth.
 */
@Service
public class WorkspaceAccessService {

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
        // TODO: validate org membership and project access from DB when auth is complete
    }

    public static class AccessDeniedException extends RuntimeException {
        public AccessDeniedException(String message) {
            super(message);
        }
    }
}
