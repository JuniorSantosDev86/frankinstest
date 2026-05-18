package com.frankintest.api.conversion;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public class WorkspaceArtifactRepository {

    private final JdbcTemplate jdbc;

    public WorkspaceArtifactRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void save(ConversionModels.WorkspaceArtifactRow row) {
        Instant now = Instant.now();
        jdbc.update("""
            INSERT INTO workspace_artifacts (
                id, organization_id, project_id, artifact_type,
                title, description, status, ai_assisted,
                source_checkup_report_id, source_section, source_item_index,
                details, created_by, created_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            row.id(), row.organizationId(), row.projectId(), row.artifactType(),
            row.title(), row.description(), row.status(), row.aiAssisted(),
            row.sourceCheckupReportId(), row.sourceSection(), row.sourceItemIndex(),
            row.details(), row.createdBy(),
            toTimestamp(row.createdAt() != null ? row.createdAt() : now),
            toTimestamp(row.updatedAt() != null ? row.updatedAt() : now)
        );
    }

    public Optional<String> findBySource(String reportId, String section, int itemIndex) {
        List<String> ids = jdbc.query(
            """
            SELECT id FROM workspace_artifacts
            WHERE source_checkup_report_id = ?
              AND source_section = ?
              AND source_item_index = ?
            LIMIT 1
            """,
            (rs, n) -> rs.getString("id"),
            reportId, section, itemIndex
        );
        return ids.isEmpty() ? Optional.empty() : Optional.of(ids.get(0));
    }

    private Timestamp toTimestamp(Instant instant) {
        return instant != null ? Timestamp.from(instant) : null;
    }
}
