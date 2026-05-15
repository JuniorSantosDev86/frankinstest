package com.frankintest.api.credits;

import org.springframework.stereotype.Service;

@Service
public class CreditService {

    private final CreditRepository repository;

    public CreditService(CreditRepository repository) {
        this.repository = repository;
    }

    public CreditModels.CreditBalance getBalance(String organizationId) {
        return repository.getOrCreateBalance(organizationId);
    }

    public void reserve(String organizationId, String userId, String aiRunId, long amount, String reason) {
        repository.reserve(organizationId, userId, aiRunId, amount, reason);
    }

    public void capture(String organizationId, String userId, String aiRunId,
                        long consumed, long reserved, String reason) {
        repository.capture(organizationId, userId, aiRunId, consumed, reserved, reason);
    }

    public void release(String organizationId, String userId, String aiRunId, long amount, String reason) {
        repository.release(organizationId, userId, aiRunId, amount, reason);
    }

    public boolean hasEnoughCredits(String organizationId, long required) {
        return getBalance(organizationId).availableCredits() >= required;
    }
}
