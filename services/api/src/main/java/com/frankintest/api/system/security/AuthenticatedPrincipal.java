package com.frankintest.api.system.security;

import java.util.List;

public record AuthenticatedPrincipal(
    String userId,
    List<String> organizationIds,
    List<String> roles
) {}
