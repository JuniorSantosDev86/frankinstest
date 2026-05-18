package com.frankintest.api.conversion;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;

@Component
public class ConversionTraceabilityHelper {

    private final WorkspaceArtifactRepository workspaceArtifactRepository;
    private final JdbcTemplate jdbc;

    public ConversionTraceabilityHelper(WorkspaceArtifactRepository workspaceArtifactRepository,
                                        JdbcTemplate jdbc) {
        this.workspaceArtifactRepository = workspaceArtifactRepository;
        this.jdbc = jdbc;
    }

    /**
     * Checks if an artifact already exists for the canonical idempotency key:
     * (sourceCheckupReportId, sourceSection, sourceItemIndex).
     * Delegates workspace_artifacts lookup to WorkspaceArtifactRepository.
     * Uses direct JdbcTemplate queries for test_scenarios and test_cases.
     */
    public Optional<ConversionModels.ExistingArtifactRef> findExistingArtifact(
            String reportId, String section, int itemIndex) {

        // Check workspace_artifacts via repository
        Optional<String> waId = workspaceArtifactRepository.findBySource(reportId, section, itemIndex);
        if (waId.isPresent()) {
            return Optional.of(new ConversionModels.ExistingArtifactRef(waId.get(), "workspace_artifacts"));
        }

        // Check test_scenarios
        List<String> tsIds = jdbc.query(
            """
            SELECT id FROM test_scenarios
            WHERE source_checkup_report_id = ?
              AND source_section = ?
              AND source_item_index = ?
            LIMIT 1
            """,
            (rs, n) -> rs.getString("id"),
            reportId, section, itemIndex
        );
        if (!tsIds.isEmpty()) {
            return Optional.of(new ConversionModels.ExistingArtifactRef(tsIds.get(0), "test_scenarios"));
        }

        // Check test_cases
        List<String> tcIds = jdbc.query(
            """
            SELECT id FROM test_cases
            WHERE source_checkup_report_id = ?
              AND source_section = ?
              AND source_item_index = ?
            LIMIT 1
            """,
            (rs, n) -> rs.getString("id"),
            reportId, section, itemIndex
        );
        if (!tcIds.isEmpty()) {
            return Optional.of(new ConversionModels.ExistingArtifactRef(tcIds.get(0), "test_cases"));
        }

        return Optional.empty();
    }
}
