package com.frankintest.api.drift;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public class DriftRepository {

    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public DriftRepository(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    // ── Artifact queries ───────────────────────────────────────────────────────

    public Optional<ArtifactRow> findArtifactById(String id, String organizationId) {
        List<ArtifactRow> rows = jdbc.query(
            """
            SELECT id, organization_id, source_checkup_report_id, source_section,
                   source_item_index, status, created_at, updated_at
            FROM workspace_artifacts
            WHERE id = ? AND organization_id = ?
            """,
            (rs, n) -> mapArtifactRow(rs),
            id, organizationId
        );
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    public List<ArtifactRow> findArtifactsBySourceReport(String reportId, String organizationId) {
        return jdbc.query(
            """
            SELECT id, organization_id, source_checkup_report_id, source_section,
                   source_item_index, status, created_at, updated_at
            FROM workspace_artifacts
            WHERE source_checkup_report_id = ? AND organization_id = ?
            """,
            (rs, n) -> mapArtifactRow(rs),
            reportId, organizationId
        );
    }

    public int countArtifactsInWorkspaceBySection(String reportId, String sectionName, String organizationId) {
        Long count = jdbc.queryForObject(
            """
            SELECT COUNT(*) FROM workspace_artifacts
            WHERE source_checkup_report_id = ?
              AND source_section = ?
              AND organization_id = ?
            """,
            Long.class,
            reportId, sectionName, organizationId
        );
        return count != null ? count.intValue() : 0;
    }

    public int countArtifactsInTestScenariosBySection(String reportId, String sectionName, String organizationId) {
        Long count = jdbc.queryForObject(
            """
            SELECT COUNT(*) FROM test_scenarios
            WHERE source_checkup_report_id = ?
              AND source_section = ?
              AND organization_id = ?
            """,
            Long.class,
            reportId, sectionName, organizationId
        );
        return count != null ? count.intValue() : 0;
    }

    public int countArtifactsInTestCasesBySection(String reportId, String sectionName, String organizationId) {
        Long count = jdbc.queryForObject(
            """
            SELECT COUNT(*) FROM test_cases
            WHERE source_checkup_report_id = ?
              AND source_section = ?
              AND organization_id = ?
            """,
            Long.class,
            reportId, sectionName, organizationId
        );
        return count != null ? count.intValue() : 0;
    }

    // ── Report queries ─────────────────────────────────────────────────────────

    public Optional<ReportRow> findReportById(String reportId, String organizationId) {
        List<ReportRow> rows = jdbc.query(
            """
            SELECT id, organization_id,
                   missing_or_unclear_requirements, quality_risks, ux_product_risks,
                   release_readiness_notes, suggested_test_scenarios, suggested_test_cases
            FROM checkup_reports
            WHERE id = ? AND organization_id = ?
            """,
            (rs, n) -> mapReportRow(rs),
            reportId, organizationId
        );
        return rows.isEmpty() ? Optional.empty() : Optional.of(rows.get(0));
    }

    // ── Row models ─────────────────────────────────────────────────────────────

    public record ArtifactRow(
        String id,
        String organizationId,
        String sourceCheckupReportId,
        String sourceSection,
        Integer sourceItemIndex,
        String status,
        Instant createdAt,
        Instant updatedAt
    ) {}

    public record ReportRow(
        String id,
        String organizationId,
        int missingOrUnclearRequirementsCount,
        int qualityRisksCount,
        int uxProductRisksCount,
        int releaseReadinessNotesCount,
        int suggestedTestScenariosCount,
        int suggestedTestCasesCount
    ) {}

    // ── Mapping ────────────────────────────────────────────────────────────────

    private ArtifactRow mapArtifactRow(ResultSet rs) throws SQLException {
        Timestamp createdAt = rs.getTimestamp("created_at");
        Timestamp updatedAt = rs.getTimestamp("updated_at");
        int rawIndex = rs.getInt("source_item_index");
        Integer sourceItemIndex = rs.wasNull() ? null : rawIndex;
        return new ArtifactRow(
            rs.getString("id"),
            rs.getString("organization_id"),
            rs.getString("source_checkup_report_id"),
            rs.getString("source_section"),
            sourceItemIndex,
            rs.getString("status"),
            createdAt != null ? createdAt.toInstant() : null,
            updatedAt != null ? updatedAt.toInstant() : null
        );
    }

    private ReportRow mapReportRow(ResultSet rs) throws SQLException {
        return new ReportRow(
            rs.getString("id"),
            rs.getString("organization_id"),
            countJsonArray(rs.getString("missing_or_unclear_requirements")),
            countJsonArray(rs.getString("quality_risks")),
            countJsonArray(rs.getString("ux_product_risks")),
            countJsonArray(rs.getString("release_readiness_notes")),
            countJsonArray(rs.getString("suggested_test_scenarios")),
            countJsonArray(rs.getString("suggested_test_cases"))
        );
    }

    private int countJsonArray(String json) {
        if (json == null || json.isBlank()) return 0;
        try {
            List<?> list = mapper.readValue(json, new TypeReference<List<Object>>() {});
            return list.size();
        } catch (JsonProcessingException e) {
            return 0;
        }
    }
}
