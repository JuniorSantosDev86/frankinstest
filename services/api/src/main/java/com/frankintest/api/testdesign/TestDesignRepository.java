package com.frankintest.api.testdesign;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;

@Repository
public class TestDesignRepository {

    private final JdbcTemplate jdbc;

    public TestDesignRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public void insertScenario(TestDesignModels.TestScenario scenario) {
        Instant now = Instant.now();
        jdbc.update("""
            INSERT INTO test_scenarios (
                id, organization_id, project_id, module_id, requirement_id, business_rule_id,
                title, description, scenario_type, priority, status,
                ai_assisted, ai_run_id, reviewed_by, reviewed_at, created_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            scenario.id(), scenario.organizationId(), scenario.projectId(),
            scenario.moduleId(), scenario.requirementId(), scenario.businessRuleId(),
            scenario.title(), scenario.description(), scenario.scenarioType(), scenario.priority(),
            scenario.status(), scenario.aiAssisted(), scenario.aiRunId(),
            scenario.reviewedBy(), toTimestamp(scenario.reviewedAt()),
            toTimestamp(scenario.createdAt() != null ? scenario.createdAt() : now),
            toTimestamp(scenario.updatedAt() != null ? scenario.updatedAt() : now)
        );
    }

    public void insertTestCase(TestDesignModels.TestCase testCase) {
        Instant now = Instant.now();
        jdbc.update("""
            INSERT INTO test_cases (
                id, organization_id, project_id, module_id, requirement_id,
                business_rule_id, scenario_id,
                title, preconditions, steps, expected_result, test_type, priority,
                automation_candidate, status, ai_assisted, ai_run_id,
                reviewed_by, reviewed_at, created_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            testCase.id(), testCase.organizationId(), testCase.projectId(),
            testCase.moduleId(), testCase.requirementId(),
            testCase.businessRuleId(), testCase.scenarioId(),
            testCase.title(), testCase.preconditions(), testCase.steps(),
            testCase.expectedResult(), testCase.testType(), testCase.priority(),
            testCase.automationCandidate(), testCase.status(), testCase.aiAssisted(), testCase.aiRunId(),
            testCase.reviewedBy(), toTimestamp(testCase.reviewedAt()),
            toTimestamp(testCase.createdAt() != null ? testCase.createdAt() : now),
            toTimestamp(testCase.updatedAt() != null ? testCase.updatedAt() : now)
        );
    }

    public List<TestDesignModels.TestScenario> findScenariosByAiRunId(String aiRunId) {
        return jdbc.query(
            "SELECT * FROM test_scenarios WHERE ai_run_id = ? ORDER BY created_at",
            (rs, n) -> new TestDesignModels.TestScenario(
                rs.getString("id"), rs.getString("organization_id"), rs.getString("project_id"),
                rs.getString("module_id"), rs.getString("requirement_id"), rs.getString("business_rule_id"),
                rs.getString("title"), rs.getString("description"), rs.getString("scenario_type"),
                rs.getString("priority"), rs.getString("status"),
                rs.getBoolean("ai_assisted"), rs.getString("ai_run_id"),
                rs.getString("reviewed_by"), toInstant(rs.getTimestamp("reviewed_at")),
                toInstant(rs.getTimestamp("created_at")), toInstant(rs.getTimestamp("updated_at"))
            ),
            aiRunId
        );
    }

    public List<TestDesignModels.TestCase> findTestCasesByAiRunId(String aiRunId) {
        return jdbc.query(
            "SELECT * FROM test_cases WHERE ai_run_id = ? ORDER BY created_at",
            (rs, n) -> new TestDesignModels.TestCase(
                rs.getString("id"), rs.getString("organization_id"), rs.getString("project_id"),
                rs.getString("module_id"), rs.getString("requirement_id"),
                rs.getString("business_rule_id"), rs.getString("scenario_id"),
                rs.getString("title"), rs.getString("preconditions"), rs.getString("steps"),
                rs.getString("expected_result"), rs.getString("test_type"), rs.getString("priority"),
                rs.getBoolean("automation_candidate"), rs.getString("status"),
                rs.getBoolean("ai_assisted"), rs.getString("ai_run_id"),
                rs.getString("reviewed_by"), toInstant(rs.getTimestamp("reviewed_at")),
                toInstant(rs.getTimestamp("created_at")), toInstant(rs.getTimestamp("updated_at"))
            ),
            aiRunId
        );
    }

    private Timestamp toTimestamp(Instant instant) {
        return instant != null ? Timestamp.from(instant) : null;
    }

    private Instant toInstant(Timestamp ts) {
        return ts != null ? ts.toInstant() : null;
    }
}
