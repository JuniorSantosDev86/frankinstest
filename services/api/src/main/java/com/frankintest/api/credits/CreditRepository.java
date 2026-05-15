package com.frankintest.api.credits;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Repository
public class CreditRepository {

    private final JdbcTemplate jdbc;

    public CreditRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public CreditModels.CreditBalance getOrCreateBalance(String organizationId) {
        List<CreditModels.CreditBalance> results = jdbc.query(
            "SELECT * FROM credit_balances WHERE organization_id = ?",
            (rs, n) -> new CreditModels.CreditBalance(
                rs.getString("organization_id"),
                rs.getLong("available_credits"),
                rs.getLong("reserved_credits"),
                rs.getTimestamp("updated_at").toInstant()
            ),
            organizationId
        );
        if (!results.isEmpty()) return results.get(0);

        // Seed a generous initial balance for dev/MVP (no billing flow yet)
        jdbc.update("""
            INSERT INTO credit_balances (organization_id, available_credits, reserved_credits, updated_at)
            VALUES (?, 10000, 0, ?)
            """, organizationId, Timestamp.from(Instant.now()));

        return new CreditModels.CreditBalance(organizationId, 10000L, 0L, Instant.now());
    }

    public void reserve(String organizationId, String userId, String aiRunId, long amount, String reason) {
        validateSufficientCredits(organizationId, amount);
        jdbc.update("""
            UPDATE credit_balances
            SET available_credits = available_credits - ?,
                reserved_credits = reserved_credits + ?,
                updated_at = ?
            WHERE organization_id = ?
            """, amount, amount, Timestamp.from(Instant.now()), organizationId);
        recordTransaction(organizationId, userId, aiRunId, CreditModels.TransactionType.reserve, amount, reason);
    }

    public void capture(String organizationId, String userId, String aiRunId, long amount, long reservedAmount, String reason) {
        long release = reservedAmount - amount;
        if (release < 0) release = 0;

        // Move reserved → consumed (captured), release remainder back to available
        jdbc.update("""
            UPDATE credit_balances
            SET reserved_credits = reserved_credits - ?,
                available_credits = available_credits + ?,
                updated_at = ?
            WHERE organization_id = ?
            """, reservedAmount, release, Timestamp.from(Instant.now()), organizationId);

        recordTransaction(organizationId, userId, aiRunId, CreditModels.TransactionType.capture, amount, reason);
        if (release > 0) {
            recordTransaction(organizationId, userId, aiRunId, CreditModels.TransactionType.release, release,
                "Liberação de créditos não utilizados após conclusão do run");
        }
    }

    public void release(String organizationId, String userId, String aiRunId, long amount, String reason) {
        jdbc.update("""
            UPDATE credit_balances
            SET reserved_credits = reserved_credits - ?,
                available_credits = available_credits + ?,
                updated_at = ?
            WHERE organization_id = ?
            """, amount, amount, Timestamp.from(Instant.now()), organizationId);
        recordTransaction(organizationId, userId, aiRunId, CreditModels.TransactionType.release, amount, reason);
    }

    private void validateSufficientCredits(String organizationId, long required) {
        CreditModels.CreditBalance balance = getOrCreateBalance(organizationId);
        if (balance.availableCredits() < required) {
            throw new CreditModels.InsufficientCreditsException(organizationId, required, balance.availableCredits());
        }
    }

    private void recordTransaction(String organizationId, String userId, String aiRunId,
                                   CreditModels.TransactionType type, long amount, String reason) {
        CreditModels.CreditBalance balance = getOrCreateBalance(organizationId);
        jdbc.update("""
            INSERT INTO credit_transactions
                (id, organization_id, user_id, ai_run_id, type, amount, reason, balance_after, created_at)
            VALUES (?,?,?,?,?,?,?,?,?)
            """,
            UUID.randomUUID().toString(), organizationId, userId, aiRunId,
            type.name(), amount, reason,
            balance.availableCredits(),
            Timestamp.from(Instant.now())
        );
    }
}
