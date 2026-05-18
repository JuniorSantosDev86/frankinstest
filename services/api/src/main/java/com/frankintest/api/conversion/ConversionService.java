package com.frankintest.api.conversion;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.airuns.AiRunModels;
import com.frankintest.api.airuns.AiRunRepository;
import com.frankintest.api.audit.AuditService;
import com.frankintest.api.checkup.CheckupModels;
import com.frankintest.api.checkup.CheckupRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class ConversionService {

    private final CheckupRepository checkupRepository;
    private final AiRunRepository aiRunRepository;
    private final WorkspaceArtifactRepository workspaceArtifactRepository;
    private final ConversionTraceabilityHelper traceabilityHelper;
    private final JdbcTemplate jdbc;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    public ConversionService(
            CheckupRepository checkupRepository,
            AiRunRepository aiRunRepository,
            WorkspaceArtifactRepository workspaceArtifactRepository,
            ConversionTraceabilityHelper traceabilityHelper,
            JdbcTemplate jdbc,
            AuditService auditService,
            ObjectMapper objectMapper) {
        this.checkupRepository = checkupRepository;
        this.aiRunRepository = aiRunRepository;
        this.workspaceArtifactRepository = workspaceArtifactRepository;
        this.traceabilityHelper = traceabilityHelper;
        this.jdbc = jdbc;
        this.auditService = auditService;
        this.objectMapper = objectMapper;
    }

    // ─── Public API ────────────────────────────────────────────────────────────

    public ConversionModels.ConversionPreviewResponse preview(
            String reportId, String organizationId,
            ConversionModels.ConversionPreviewRequest request) {

        if (request.selectedItems() == null || request.selectedItems().isEmpty()) {
            throw new ConversionModels.ConversionValidationException(
                "selectedItems", "Selecione ao menos um item para pré-visualizar.");
        }

        CheckupModels.CheckupReport report = validateAccess(reportId, organizationId);
        AiRunModels.AiRun aiRun = validateEligibility(report);
        String projectId = resolveProjectId(aiRun);

        List<ConversionModels.ConversionPreviewItem> items = new ArrayList<>();
        for (ConversionModels.ConversionSelectedItem sel : request.selectedItems()) {
            items.add(buildPreviewItem(report, sel.sourceSection(), sel.sourceItemIndex(), reportId));
        }

        return new ConversionModels.ConversionPreviewResponse(reportId, organizationId, projectId, items);
    }

    @Transactional
    public ConversionModels.ConversionResult confirm(
            String reportId, String organizationId, String userId,
            ConversionModels.ConversionConfirmRequest request) {

        if (request.items() == null || request.items().isEmpty()) {
            throw new ConversionModels.ConversionValidationException(
                "items", "A lista de itens não pode ser vazia.");
        }

        CheckupModels.CheckupReport report = validateAccess(reportId, organizationId);
        AiRunModels.AiRun aiRun = validateEligibility(report);
        String projectId = resolveProjectId(aiRun);

        List<ConversionModels.ConversionConfirmItem> toCreate = request.items().stream()
            .filter(i -> i.intent() == ConversionModels.ConversionIntent.CREATE_NEW)
            .toList();

        if (toCreate.isEmpty()) {
            throw new ConversionModels.ConversionValidationException(
                "items", "Selecione ao menos um item com intenção de criar artefato.");
        }

        int skipped = (int) request.items().stream()
            .filter(i -> i.intent() == ConversionModels.ConversionIntent.SKIP)
            .count();

        List<ConversionModels.CreatedArtifact> created = new ArrayList<>();

        for (ConversionModels.ConversionConfirmItem item : toCreate) {
            ConversionModels.CreatedArtifact artifact =
                persistArtifact(report, item.sourceSection(), item.sourceItemIndex(), organizationId, projectId, userId);
            created.add(artifact);
        }

        try {
            auditService.record(AuditService.AuditEvent.of(
                organizationId, userId,
                "CHECKUP_ARTIFACTS_CONVERTED",
                "checkup_report", reportId,
                buildAuditMetadata(created)
            ));
        } catch (Exception ignored) {
            // Audit failure must not override the primary conversion result
        }

        return new ConversionModels.ConversionResult(reportId, created, skipped);
    }

    // ─── Guards ────────────────────────────────────────────────────────────────

    CheckupModels.CheckupReport validateAccess(String reportId, String organizationId) {
        CheckupModels.CheckupReport report = checkupRepository.findById(reportId)
            .orElseThrow(() -> new ConversionModels.ReportNotFoundException(reportId));
        if (!report.organizationId().equals(organizationId)) {
            throw new org.springframework.security.access.AccessDeniedException(
                "Acesso negado a este relatório.");
        }
        return report;
    }

    AiRunModels.AiRun validateEligibility(CheckupModels.CheckupReport report) {
        AiRunModels.AiRun aiRun = aiRunRepository.findById(report.aiRunId())
            .orElseThrow(() -> new ConversionModels.ReportNotEligibleException());
        if (aiRun.status() != AiRunModels.AiRunStatus.completed) {
            throw new ConversionModels.ReportNotEligibleException();
        }
        return aiRun;
    }

    String resolveProjectId(AiRunModels.AiRun aiRun) {
        String pid = aiRun.projectId();
        if (pid == null || pid.isBlank() || "default".equalsIgnoreCase(pid)) {
            return null;
        }
        return pid;
    }

    // ─── Preview helpers ───────────────────────────────────────────────────────

    private ConversionModels.ConversionPreviewItem buildPreviewItem(
            CheckupModels.CheckupReport report,
            String section, int index, String reportId) {

        SectionData data = extractItem(report, section, index);
        Optional<ConversionModels.ExistingArtifactRef> existing =
            traceabilityHelper.findExistingArtifact(reportId, section, index);

        return new ConversionModels.ConversionPreviewItem(
            section, index,
            data.artifactType(), data.targetTable(),
            data.title(), data.description(),
            existing.isPresent(),
            existing.map(ConversionModels.ExistingArtifactRef::artifactId).orElse(null),
            existing.map(ConversionModels.ExistingArtifactRef::tableName).orElse(null)
        );
    }

    // ─── Persist artifact ──────────────────────────────────────────────────────

    private ConversionModels.CreatedArtifact persistArtifact(
            CheckupModels.CheckupReport report,
            String section, int index,
            String organizationId, String projectId, String userId) {

        SectionData data = extractItem(report, section, index);
        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();

        switch (data.artifactType()) {
            case TEST_SCENARIO -> persistTestScenario(
                id, organizationId, projectId, data, report.id(), section, index, now);
            case TEST_CASE -> persistTestCase(
                id, organizationId, projectId, data, report.id(), section, index, now);
            default -> {
                String details = buildDetails(data);
                workspaceArtifactRepository.save(new ConversionModels.WorkspaceArtifactRow(
                    id, organizationId, projectId,
                    data.artifactType().name(),
                    data.title(), data.description(),
                    "DRAFT", true,
                    report.id(), section, index,
                    details, userId,
                    now, now
                ));
            }
        }

        return new ConversionModels.CreatedArtifact(
            id, data.artifactType(), data.targetTable(), section, index);
    }

    private void persistTestScenario(String id, String orgId, String projectId,
                                     SectionData data, String reportId,
                                     String section, int index, Instant now) {
        jdbc.update("""
            INSERT INTO test_scenarios (
                id, organization_id, project_id,
                title, description, scenario_type, priority, status,
                ai_assisted, source_checkup_report_id, source_section, source_item_index,
                created_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            id, orgId, projectId,
            data.title(), data.description(),
            data.scenarioType(), "MEDIUM", "draft",
            true, reportId, section, index,
            java.sql.Timestamp.from(now), java.sql.Timestamp.from(now)
        );
    }

    private void persistTestCase(String id, String orgId, String projectId,
                                 SectionData data, String reportId,
                                 String section, int index, Instant now) {
        jdbc.update("""
            INSERT INTO test_cases (
                id, organization_id, project_id,
                title, preconditions, steps, expected_result, priority, status,
                ai_assisted, source_checkup_report_id, source_section, source_item_index,
                created_at, updated_at
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
            """,
            id, orgId, projectId,
            data.title(), data.preconditions(), data.steps(), data.expectedResult(),
            "MEDIUM", "draft",
            true, reportId, section, index,
            java.sql.Timestamp.from(now), java.sql.Timestamp.from(now)
        );
    }

    // ─── Section extraction ────────────────────────────────────────────────────

    SectionData extractItem(CheckupModels.CheckupReport report, String section, int index) {
        return switch (section) {
            case "missing_or_unclear_requirements" -> {
                List<CheckupModels.FindingItem> list = report.missingOrUnclearRequirements();
                validateIndex(list, index, section);
                CheckupModels.FindingItem item = list.get(index);
                yield new SectionData(
                    ConversionModels.ArtifactType.REQUIREMENT, "workspace_artifacts",
                    "Requisito: " + item.title(), item.description(),
                    null, null, null, null, item.severity().name()
                );
            }
            case "suggested_test_scenarios" -> {
                List<CheckupModels.ScenarioItem> list = report.suggestedTestScenarios();
                validateIndex(list, index, section);
                CheckupModels.ScenarioItem item = list.get(index);
                yield new SectionData(
                    ConversionModels.ArtifactType.TEST_SCENARIO, "test_scenarios",
                    item.title(), item.description(),
                    item.type().name(), null, null, null, null
                );
            }
            case "suggested_test_cases" -> {
                List<CheckupModels.TestCaseItem> list = report.suggestedTestCases();
                validateIndex(list, index, section);
                CheckupModels.TestCaseItem item = list.get(index);
                String stepsJson = toJson(item.steps());
                yield new SectionData(
                    ConversionModels.ArtifactType.TEST_CASE, "test_cases",
                    item.title(), null,
                    null, item.preconditions(), stepsJson, item.expectedResult(), null
                );
            }
            case "quality_risks" -> {
                List<CheckupModels.FindingItem> list = report.qualityRisks();
                validateIndex(list, index, section);
                CheckupModels.FindingItem item = list.get(index);
                yield new SectionData(
                    ConversionModels.ArtifactType.RISK_ITEM, "workspace_artifacts",
                    "Risco: " + item.title(), item.description(),
                    null, null, null, null, item.severity().name()
                );
            }
            case "ux_product_risks" -> {
                List<CheckupModels.FindingItem> list = report.uxProductRisks();
                validateIndex(list, index, section);
                CheckupModels.FindingItem item = list.get(index);
                yield new SectionData(
                    ConversionModels.ArtifactType.RISK_ITEM, "workspace_artifacts",
                    "Risco UX: " + item.title(), item.description(),
                    null, null, null, null, item.severity().name()
                );
            }
            case "release_readiness_notes" -> {
                List<CheckupModels.FindingItem> list = report.releaseReadinessNotes();
                validateIndex(list, index, section);
                CheckupModels.FindingItem item = list.get(index);
                yield new SectionData(
                    ConversionModels.ArtifactType.QA_ACTION, "workspace_artifacts",
                    "Ação: " + item.title(), item.description(),
                    null, null, null, null, item.severity().name()
                );
            }
            default -> throw new ConversionModels.ConversionValidationException(
                "sourceSection", "Seção inválida: " + section);
        };
    }

    private void validateIndex(List<?> list, int index, String section) {
        if (index < 0 || index >= list.size()) {
            throw new ConversionModels.ConversionValidationException(
                "sourceItemIndex",
                "Índice " + index + " fora do intervalo para seção '" + section + "'.");
        }
    }

    private String buildDetails(SectionData data) {
        try {
            Map<String, Object> map = new LinkedHashMap<>();
            if (data.severity() != null) map.put("severity", data.severity());
            if (data.artifactType() == ConversionModels.ArtifactType.RISK_ITEM) {
                map.put("riskCategory", "QUALITY");
            }
            return objectMapper.writeValueAsString(map);
        } catch (Exception e) {
            return "{}";
        }
    }

    private String toJson(List<String> list) {
        try {
            return objectMapper.writeValueAsString(list != null ? list : List.of());
        } catch (Exception e) {
            return "[]";
        }
    }

    private String buildAuditMetadata(List<ConversionModels.CreatedArtifact> created) {
        try {
            return objectMapper.writeValueAsString(Map.of(
                "artifactsCreated", created.size(),
                "artifactIds", created.stream().map(ConversionModels.CreatedArtifact::artifactId).toList()
            ));
        } catch (Exception e) {
            return "{}";
        }
    }

    // ─── Internal data carrier ─────────────────────────────────────────────────

    record SectionData(
        ConversionModels.ArtifactType artifactType,
        String targetTable,
        String title,
        String description,
        String scenarioType,
        String preconditions,
        String steps,
        String expectedResult,
        String severity
    ) {}
}
