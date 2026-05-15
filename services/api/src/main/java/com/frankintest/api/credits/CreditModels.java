package com.frankintest.api.credits;

import java.time.Instant;

public class CreditModels {

    public enum TransactionType {
        reserve, capture, release, refund, adjustment
    }

    public record CreditBalance(
        String organizationId,
        long availableCredits,
        long reservedCredits,
        Instant updatedAt
    ) {}

    public record CreditTransaction(
        String id,
        String organizationId,
        String userId,
        String aiRunId,
        TransactionType type,
        long amount,
        String reason,
        Long balanceAfter,
        Instant createdAt
    ) {}

    public static class InsufficientCreditsException extends RuntimeException {
        public final String organizationId;
        public final long required;
        public final long available;

        public InsufficientCreditsException(String organizationId, long required, long available) {
            super("Créditos insuficientes para a organização " + organizationId +
                ": necessário=" + required + ", disponível=" + available);
            this.organizationId = organizationId;
            this.required = required;
            this.available = available;
        }
    }
}
