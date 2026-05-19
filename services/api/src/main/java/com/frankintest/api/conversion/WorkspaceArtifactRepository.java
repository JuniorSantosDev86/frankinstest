package com.frankintest.api.conversion;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Repository
public class WorkspaceArtifactRepository {

    private static final int LIST_LIMIT = 200;

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
                source_checkup_report_id, source_ai_run_id, source_section, source_item_index,
                details, created_by, created_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            row.id(), row.organizationId(), row.projectId(), row.artifactType(),
            row.title(), row.description(), row.status(), row.aiAssisted(),
            row.sourceCheckupReportId(), row.sourceAiRunId(), row.sourceSection(), row.sourceItemIndex(),
            row.details(), row.createdBy(),
            toTimestamp(row.createdAt() != null ? row.createdAt() : now),
            toTimestamp(row.updatedAt() != null ? row.updatedAt() : now)
        );
    }

    // ── Bloco 14: review & editing methods ────────────────────────────────────

    public Optional<ConversionModels.WorkspaceArtifactRow> findById(String id, String organizationId) {
        List<ConversionModels.WorkspaceArtifactRow> rows = jdbc.query(
            """
            SELECT id, organization_id, project_id, artifact_type,
                   title, description, status, ai_assisted,
                   source_checkup_report_id, source_ai_run_id, source_section, source_item_index,
                   details, created_by, created_at, updated_at
            FROM workspace_artifacts
            WHERE id = ? AND organization_id = ?
            """,
            (rs, n) -> mapRow(rs),
            id, organizationId
        );
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public List<ConversionModels.WorkspaceArtifactRow> findByOrganization(
            String organizationId,
            String projectId,
            String sourceCheckupReportId,
            String artifactType,
            String status) {

        StringBuilder sql = new StringBuilder("""
            SELECT id, organization_id, project_id, artifact_type,
                   title, description, status, ai_assisted,
                   source_checkup_report_id, source_ai_run_id, source_section, source_item_index,
                   details, created_by, created_at, updated_at
            FROM workspace_artifacts
            WHERE organization_id = ?
            """);
        List<Object> params = new ArrayList<>();
        params.add(organizationId);

        if (projectId != null && !projectId.isBlank()) {
            sql.append("  AND project_id = ?\n");
            params.add(projectId);
        }
        if (sourceCheckupReportId != null && !sourceCheckupReportId.isBlank()) {
            sql.append("  AND source_checkup_report_id = ?\n");
            params.add(sourceCheckupReportId);
        }
        if (artifactType != null && !artifactType.isBlank()) {
            sql.append("  AND artifact_type = ?\n");
            params.add(artifactType);
        }
        if (status != null && !status.isBlank()) {
            sql.append("  AND status = ?\n");
            params.add(status);
        }
        sql.append("ORDER BY created_at DESC\nLIMIT ").append(LIST_LIMIT);

        return jdbc.query(sql.toString(), (rs, n) -> mapRow(rs), params.toArray());
    }

    public long countByOrganization(
            String organizationId,
            String projectId,
            String sourceCheckupReportId,
            String artifactType,
            String status) {

        StringBuilder sql = new StringBuilder(
            "SELECT COUNT(*) FROM workspace_artifacts WHERE organization_id = ?\n");
        List<Object> params = new ArrayList<>();
        params.add(organizationId);

        if (projectId != null && !projectId.isBlank()) {
            sql.append("  AND project_id = ?\n");
            params.add(projectId);
        }
        if (sourceCheckupReportId != null && !sourceCheckupReportId.isBlank()) {
            sql.append("  AND source_checkup_report_id = ?\n");
            params.add(sourceCheckupReportId);
        }
        if (artifactType != null && !artifactType.isBlank()) {
            sql.append("  AND artifact_type = ?\n");
            params.add(artifactType);
        }
        if (status != null && !status.isBlank()) {
            sql.append("  AND status = ?\n");
            params.add(status);
        }

        Long count = jdbc.queryForObject(sql.toString(), Long.class, params.toArray());
        return count != null ? count : 0L;
    }

    public boolean updateEditableFields(String id, String organizationId,
                                        String title, String description,
                                        String status, String details) {
        int updated = jdbc.update("""
            UPDATE workspace_artifacts
            SET title       = COALESCE(?, title),
                description = COALESCE(?, description),
                status      = COALESCE(?, status),
                details     = COALESCE(?, details),
                updated_at  = NOW()
            WHERE id = ? AND organization_id = ?
            """,
            title, description, status, details, id, organizationId
        );
        return updated > 0;
    }

    private ConversionModels.WorkspaceArtifactRow mapRow(ResultSet rs) throws SQLException {
        Timestamp createdAt = rs.getTimestamp("created_at");
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        int rawIndex = rs.getInt("source_item_index");
        Integer sourceItemIndex = rs.wasNull() ? null : rawIndex;
        return new ConversionModels.WorkspaceArtifactRow(
            rs.getString("id"),
            rs.getString("organization_id"),
            rs.getString("project_id"),
            rs.getString("artifact_type"),
            rs.getString("title"),
            rs.getString("description"),
            rs.getString("status"),
            rs.getBoolean("ai_assisted"),
            rs.getString("source_checkup_report_id"),
            rs.getString("source_ai_run_id"),
            rs.getString("source_section"),
            sourceItemIndex,
            rs.getString("details"),
            rs.getString("created_by"),
            createdAt != null ? createdAt.toInstant() : null,
            updatedAt != null ? updatedAt.toInstant() : null
        );
    }

    // ── end Bloco 14 methods ───────────────────────────────────────────────────

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
