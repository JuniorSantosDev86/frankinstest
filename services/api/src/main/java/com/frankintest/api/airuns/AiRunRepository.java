package com.frankintest.api.airuns;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Repository
public class AiRunRepository {

    private final JdbcTemplate jdbc;

    public AiRunRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insert(AiRunModels.AiRun run) {
        jdbc.update("""
            INSERT INTO ai_runs (
                id, organization_id, project_id, user_id, feature,
                source_artifact_type, source_artifact_id, input_summary,
                estimated_credits, reserved_credits, consumed_credits,
                status, failure_category, output_artifact_type, output_artifact_ids,
                created_at, started_at, completed_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            run.id(), run.organizationId(), run.projectId(), run.userId(),
            run.feature().name(),
            run.sourceArtifactType() != null ? run.sourceArtifactType().name() : null,
            run.sourceArtifactId(), run.inputSummary(),
            run.estimatedCredits(), run.reservedCredits(), run.consumedCredits(),
            run.status().name(),
            run.failureCategory() != null ? run.failureCategory().name() : AiRunModels.AiRunFailureCategory.none.name(),
            run.outputArtifactType() != null ? run.outputArtifactType().name() : null,
            run.outputArtifactIds() != null ? String.join(",", run.outputArtifactIds()) : null,
            toTimestamp(run.createdAt()), toTimestamp(run.startedAt()), toTimestamp(run.completedAt())
        );
    }

    public void updateStatus(String id, AiRunModels.AiRunStatus status, AiRunModels.AiRunFailureCategory failureCategory,
                             long consumedCredits, List<String> outputArtifactIds, Instant completedAt) {
        jdbc.update("""
            UPDATE ai_runs SET
                status = ?, failure_category = ?, consumed_credits = ?,
                output_artifact_ids = ?, completed_at = ?
            WHERE id = ?
            """,
            status.name(),
            failureCategory != null ? failureCategory.name() : AiRunModels.AiRunFailureCategory.none.name(),
            consumedCredits,
            outputArtifactIds != null ? String.join(",", outputArtifactIds) : null,
            toTimestamp(completedAt),
            id
        );
    }

    public void updateToRunning(String id, Instant startedAt) {
        jdbc.update("UPDATE ai_runs SET status = 'running', started_at = ? WHERE id = ?",
            toTimestamp(startedAt), id);
    }

    public void updateReservedCredits(String id, long reservedCredits) {
        jdbc.update("UPDATE ai_runs SET reserved_credits = ?, status = 'reserved' WHERE id = ?",
            reservedCredits, id);
    }

    public Optional<AiRunModels.AiRun> findById(String id) {
        List<AiRunModels.AiRun> results = jdbc.query(
            "SELECT * FROM ai_runs WHERE id = ?",
            (rs, rowNum) -> mapRow(rs),
            id
        );
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    private AiRunModels.AiRun mapRow(ResultSet rs) throws SQLException {
        String outputIdsRaw = rs.getString("output_artifact_ids");
        List<String> outputIds = outputIdsRaw != null && !outputIdsRaw.isBlank()
            ? Arrays.asList(outputIdsRaw.split(","))
            : List.of();

        return new AiRunModels.AiRun(
            rs.getString("id"),
            rs.getString("organization_id"),
            rs.getString("project_id"),
            rs.getString("user_id"),
            AiRunModels.AiRunFeature.valueOf(rs.getString("feature")),
            parseEnum(AiRunModels.SourceArtifactType.class, rs.getString("source_artifact_type")),
            rs.getString("source_artifact_id"),
            rs.getString("input_summary"),
            rs.getLong("estimated_credits"),
            rs.getLong("reserved_credits"),
            rs.getLong("consumed_credits"),
            AiRunModels.AiRunStatus.valueOf(rs.getString("status")),
            parseEnum(AiRunModels.AiRunFailureCategory.class, rs.getString("failure_category")),
            parseEnum(AiRunModels.OutputArtifactType.class, rs.getString("output_artifact_type")),
            outputIds,
            toInstant(rs.getTimestamp("created_at")),
            toInstant(rs.getTimestamp("started_at")),
            toInstant(rs.getTimestamp("completed_at"))
        );
    }

    private <E extends Enum<E>> E parseEnum(Class<E> cls, String value) {
        if (value == null || value.isBlank()) return null;
        try { return Enum.valueOf(cls, value); } catch (IllegalArgumentException e) { return null; }
    }

    private Timestamp toTimestamp(Instant instant) {
        return instant != null ? Timestamp.from(instant) : null;
    }

    private Instant toInstant(Timestamp ts) {
        return ts != null ? ts.toInstant() : null;
    }
}
