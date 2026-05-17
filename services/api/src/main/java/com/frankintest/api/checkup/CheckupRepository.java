package com.frankintest.api.checkup;

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
public class CheckupRepository {

    private final JdbcTemplate jdbc;
    private final ObjectMapper mapper;

    public CheckupRepository(JdbcTemplate jdbc, ObjectMapper mapper) {
        this.jdbc = jdbc;
        this.mapper = mapper;
    }

    public void save(CheckupModels.CheckupReport report) {
        jdbc.update("""
            INSERT INTO checkup_reports (
                id, ai_run_id, organization_id, user_id, status,
                target_type, target_value, context, goal, depth,
                quality_risks, missing_or_unclear_requirements,
                suggested_test_scenarios, suggested_test_cases,
                ux_product_risks, release_readiness_notes,
                recommended_next_actions, raw_ai_output,
                created_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            report.id(), report.aiRunId(), report.organizationId(), report.userId(),
            report.status().name(),
            report.targetType().name(), report.targetValue(), report.context(), report.goal(),
            report.depth().name(),
            toJson(report.qualityRisks()),
            toJson(report.missingOrUnclearRequirements()),
            toJson(report.suggestedTestScenarios()),
            toJson(report.suggestedTestCases()),
            toJson(report.uxProductRisks()),
            toJson(report.releaseReadinessNotes()),
            toJson(report.recommendedNextActions()),
            report.rawAiOutput(),
            toTimestamp(report.createdAt()),
            toTimestamp(report.updatedAt())
        );
    }

    public Optional<CheckupModels.CheckupReport> findByAiRunId(String aiRunId) {
        var results = jdbc.query(
            "SELECT * FROM checkup_reports WHERE ai_run_id = ? LIMIT 1",
            (rs, rowNum) -> mapRow(rs),
            aiRunId
        );
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    public Optional<CheckupModels.CheckupReport> findById(String id) {
        var results = jdbc.query(
            "SELECT * FROM checkup_reports WHERE id = ? LIMIT 1",
            (rs, rowNum) -> mapRow(rs),
            id
        );
        return results.isEmpty() ? Optional.empty() : Optional.of(results.get(0));
    }

    private CheckupModels.CheckupReport mapRow(ResultSet rs) throws SQLException {
        return new CheckupModels.CheckupReport(
            rs.getString("id"),
            rs.getString("ai_run_id"),
            rs.getString("organization_id"),
            rs.getString("user_id"),
            CheckupModels.ReportStatus.valueOf(rs.getString("status")),
            CheckupModels.TargetType.valueOf(rs.getString("target_type")),
            rs.getString("target_value"),
            rs.getString("context"),
            rs.getString("goal"),
            CheckupModels.CheckupDepth.valueOf(rs.getString("depth")),
            fromJson(rs.getString("quality_risks"), new TypeReference<List<CheckupModels.FindingItem>>() {}),
            fromJson(rs.getString("missing_or_unclear_requirements"), new TypeReference<List<CheckupModels.FindingItem>>() {}),
            fromJson(rs.getString("suggested_test_scenarios"), new TypeReference<List<CheckupModels.ScenarioItem>>() {}),
            fromJson(rs.getString("suggested_test_cases"), new TypeReference<List<CheckupModels.TestCaseItem>>() {}),
            fromJson(rs.getString("ux_product_risks"), new TypeReference<List<CheckupModels.FindingItem>>() {}),
            fromJson(rs.getString("release_readiness_notes"), new TypeReference<List<CheckupModels.FindingItem>>() {}),
            fromJson(rs.getString("recommended_next_actions"), new TypeReference<List<CheckupModels.ActionItem>>() {}),
            rs.getString("raw_ai_output"),
            toInstant(rs.getTimestamp("created_at")),
            toInstant(rs.getTimestamp("updated_at"))
        );
    }

    private String toJson(Object value) {
        try {
            return mapper.writeValueAsString(value != null ? value : List.of());
        } catch (JsonProcessingException e) {
            return "[]";
        }
    }

    private <T> T fromJson(String json, TypeReference<T> type) {
        try {
            return mapper.readValue(json != null && !json.isBlank() ? json : "[]", type);
        } catch (JsonProcessingException e) {
            try {
                return mapper.readValue("[]", type);
            } catch (JsonProcessingException ex) {
                return null;
            }
        }
    }

    private Timestamp toTimestamp(Instant instant) {
        return instant != null ? Timestamp.from(instant) : null;
    }

    private Instant toInstant(Timestamp ts) {
        return ts != null ? ts.toInstant() : null;
    }
}
