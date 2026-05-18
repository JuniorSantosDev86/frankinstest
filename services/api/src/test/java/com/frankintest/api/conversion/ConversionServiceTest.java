package com.frankintest.api.conversion;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.airuns.AiRunModels;
import com.frankintest.api.airuns.AiRunRepository;
import com.frankintest.api.audit.AuditService;
import com.frankintest.api.checkup.CheckupModels;
import com.frankintest.api.checkup.CheckupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class ConversionServiceTest {

    private CheckupRepository checkupRepository;
    private AiRunRepository aiRunRepository;
    private WorkspaceArtifactRepository workspaceArtifactRepository;
    private ConversionTraceabilityHelper traceabilityHelper;
    private JdbcTemplate jdbc;
    private AuditService auditService;
    private ConversionService service;

    private static final String ORG_ID = "org_test";
    private static final String USER_ID = "user_test";
    private static final String REPORT_ID = "rpt_test_001";
    private static final String AI_RUN_ID = "run_test_001";

    @BeforeEach
    void setUp() {
        checkupRepository = mock(CheckupRepository.class);
        aiRunRepository = mock(AiRunRepository.class);
        workspaceArtifactRepository = mock(WorkspaceArtifactRepository.class);
        traceabilityHelper = mock(ConversionTraceabilityHelper.class);
        jdbc = mock(JdbcTemplate.class);
        auditService = mock(AuditService.class);
        service = new ConversionService(
            checkupRepository, aiRunRepository, workspaceArtifactRepository,
            traceabilityHelper, jdbc, auditService, new ObjectMapper()
        );
    }

    // ─── validateAccess ────────────────────────────────────────────────────────

    @Test
    void validateAccess_reportNotFound_throwsReportNotFoundException() {
        when(checkupRepository.findById(REPORT_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.validateAccess(REPORT_ID, ORG_ID))
            .isInstanceOf(ConversionModels.ReportNotFoundException.class);
    }

    @Test
    void validateAccess_wrongOrg_throwsAccessDeniedException() {
        CheckupModels.CheckupReport report = reportWithOrg("org_other");
        when(checkupRepository.findById(REPORT_ID)).thenReturn(Optional.of(report));

        assertThatThrownBy(() -> service.validateAccess(REPORT_ID, ORG_ID))
            .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
    }

    @Test
    void validateAccess_correctOrg_returnsReport() {
        CheckupModels.CheckupReport report = reportWithOrg(ORG_ID);
        when(checkupRepository.findById(REPORT_ID)).thenReturn(Optional.of(report));

        CheckupModels.CheckupReport result = service.validateAccess(REPORT_ID, ORG_ID);
        assertThat(result.id()).isEqualTo(REPORT_ID);
    }

    // ─── validateEligibility ──────────────────────────────────────────────────

    @Test
    void validateEligibility_aiRunNotFound_throwsNotEligible() {
        CheckupModels.CheckupReport report = reportWithOrg(ORG_ID);
        when(aiRunRepository.findById(AI_RUN_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.validateEligibility(report))
            .isInstanceOf(ConversionModels.ReportNotEligibleException.class);
    }

    @Test
    void validateEligibility_aiRunNotCompleted_throwsNotEligible() {
        CheckupModels.CheckupReport report = reportWithOrg(ORG_ID);
        AiRunModels.AiRun aiRun = aiRunWithStatus(AiRunModels.AiRunStatus.running);
        when(aiRunRepository.findById(AI_RUN_ID)).thenReturn(Optional.of(aiRun));

        assertThatThrownBy(() -> service.validateEligibility(report))
            .isInstanceOf(ConversionModels.ReportNotEligibleException.class);
    }

    @Test
    void validateEligibility_aiRunCompleted_returnsAiRun() {
        CheckupModels.CheckupReport report = reportWithOrg(ORG_ID);
        AiRunModels.AiRun aiRun = aiRunWithStatus(AiRunModels.AiRunStatus.completed);
        when(aiRunRepository.findById(AI_RUN_ID)).thenReturn(Optional.of(aiRun));

        AiRunModels.AiRun result = service.validateEligibility(report);
        assertThat(result.status()).isEqualTo(AiRunModels.AiRunStatus.completed);
    }

    // ─── resolveProjectId ─────────────────────────────────────────────────────

    @Test
    void resolveProjectId_blankProjectId_returnsNull() {
        AiRunModels.AiRun aiRun = aiRunWithProjectId("");
        assertThat(service.resolveProjectId(aiRun)).isNull();
    }

    @Test
    void resolveProjectId_defaultProjectId_returnsNull() {
        AiRunModels.AiRun aiRun = aiRunWithProjectId("default");
        assertThat(service.resolveProjectId(aiRun)).isNull();
    }

    @Test
    void resolveProjectId_validProjectId_returnsIt() {
        AiRunModels.AiRun aiRun = aiRunWithProjectId("proj_123");
        assertThat(service.resolveProjectId(aiRun)).isEqualTo("proj_123");
    }

    // ─── extractItem ──────────────────────────────────────────────────────────

    @Test
    void extractItem_invalidSection_throwsValidationException() {
        CheckupModels.CheckupReport report = reportWithOrg(ORG_ID);

        assertThatThrownBy(() -> service.extractItem(report, "invalid_section", 0))
            .isInstanceOf(ConversionModels.ConversionValidationException.class)
            .hasMessageContaining("Seção inválida");
    }

    @Test
    void extractItem_indexOutOfRange_throwsValidationException() {
        CheckupModels.CheckupReport report = reportWithOrg(ORG_ID);

        assertThatThrownBy(() -> service.extractItem(report, "missing_or_unclear_requirements", 99))
            .isInstanceOf(ConversionModels.ConversionValidationException.class)
            .hasMessageContaining("Índice");
    }

    @Test
    void extractItem_requirement_mapsCorrectly() {
        CheckupModels.CheckupReport report = reportWithOrg(ORG_ID);

        ConversionService.SectionData data =
            service.extractItem(report, "missing_or_unclear_requirements", 0);

        assertThat(data.artifactType()).isEqualTo(ConversionModels.ArtifactType.REQUIREMENT);
        assertThat(data.targetTable()).isEqualTo("workspace_artifacts");
        assertThat(data.title()).contains("Validação de e-mail");
    }

    @Test
    void extractItem_testScenario_mapsCorrectly() {
        CheckupModels.CheckupReport report = reportWithOrg(ORG_ID);

        ConversionService.SectionData data =
            service.extractItem(report, "suggested_test_scenarios", 0);

        assertThat(data.artifactType()).isEqualTo(ConversionModels.ArtifactType.TEST_SCENARIO);
        assertThat(data.targetTable()).isEqualTo("test_scenarios");
    }

    // ─── preview ──────────────────────────────────────────────────────────────

    @Test
    void preview_emptySelectedItems_throwsValidationException() {
        var request = new ConversionModels.ConversionPreviewRequest(List.of());

        assertThatThrownBy(() -> service.preview(REPORT_ID, ORG_ID, request))
            .isInstanceOf(ConversionModels.ConversionValidationException.class);
    }

    @Test
    void preview_completedReport_returnsPreviewItems() {
        setupCompletedReport();
        when(traceabilityHelper.findExistingArtifact(anyString(), anyString(), anyInt()))
            .thenReturn(Optional.empty());

        var request = new ConversionModels.ConversionPreviewRequest(List.of(
            new ConversionModels.ConversionSelectedItem("missing_or_unclear_requirements", 0)
        ));

        ConversionModels.ConversionPreviewResponse response =
            service.preview(REPORT_ID, ORG_ID, request);

        assertThat(response.reportId()).isEqualTo(REPORT_ID);
        assertThat(response.items()).hasSize(1);
        assertThat(response.items().get(0).artifactType())
            .isEqualTo(ConversionModels.ArtifactType.REQUIREMENT);
        assertThat(response.items().get(0).alreadyConverted()).isFalse();
    }

    @Test
    void preview_alreadyConvertedItem_flagsAlreadyConverted() {
        setupCompletedReport();
        when(traceabilityHelper.findExistingArtifact(anyString(), anyString(), anyInt()))
            .thenReturn(Optional.of(new ConversionModels.ExistingArtifactRef("wa_existing", "workspace_artifacts")));

        var request = new ConversionModels.ConversionPreviewRequest(List.of(
            new ConversionModels.ConversionSelectedItem("missing_or_unclear_requirements", 0)
        ));

        ConversionModels.ConversionPreviewResponse response =
            service.preview(REPORT_ID, ORG_ID, request);

        assertThat(response.items().get(0).alreadyConverted()).isTrue();
        assertThat(response.items().get(0).existingArtifactId()).isEqualTo("wa_existing");
    }

    // ─── confirm ──────────────────────────────────────────────────────────────

    @Test
    void confirm_emptyItems_throwsValidationException() {
        var request = new ConversionModels.ConversionConfirmRequest(List.of());

        assertThatThrownBy(() -> service.confirm(REPORT_ID, ORG_ID, USER_ID, request))
            .isInstanceOf(ConversionModels.ConversionValidationException.class);
    }

    @Test
    void confirm_allSkip_throwsValidationException() {
        setupCompletedReport();
        var request = new ConversionModels.ConversionConfirmRequest(List.of(
            new ConversionModels.ConversionConfirmItem(
                "missing_or_unclear_requirements", 0, ConversionModels.ConversionIntent.SKIP)
        ));

        assertThatThrownBy(() -> service.confirm(REPORT_ID, ORG_ID, USER_ID, request))
            .isInstanceOf(ConversionModels.ConversionValidationException.class);
    }

    @Test
    void confirm_createNew_persistsArtifactAndAudits() {
        setupCompletedReport();
        var request = new ConversionModels.ConversionConfirmRequest(List.of(
            new ConversionModels.ConversionConfirmItem(
                "missing_or_unclear_requirements", 0, ConversionModels.ConversionIntent.CREATE_NEW)
        ));

        ConversionModels.ConversionResult result =
            service.confirm(REPORT_ID, ORG_ID, USER_ID, request);

        assertThat(result.createdArtifacts()).hasSize(1);
        assertThat(result.skippedCount()).isEqualTo(0);
        assertThat(result.createdArtifacts().get(0).artifactType())
            .isEqualTo(ConversionModels.ArtifactType.REQUIREMENT);
        verify(workspaceArtifactRepository).save(any(ConversionModels.WorkspaceArtifactRow.class));
        verify(auditService).record(any(AuditService.AuditEvent.class));
    }

    @Test
    void confirm_mixedIntents_onlyCreatesNew() {
        setupCompletedReport();
        var request = new ConversionModels.ConversionConfirmRequest(List.of(
            new ConversionModels.ConversionConfirmItem(
                "missing_or_unclear_requirements", 0, ConversionModels.ConversionIntent.CREATE_NEW),
            new ConversionModels.ConversionConfirmItem(
                "quality_risks", 0, ConversionModels.ConversionIntent.SKIP)
        ));

        ConversionModels.ConversionResult result =
            service.confirm(REPORT_ID, ORG_ID, USER_ID, request);

        assertThat(result.createdArtifacts()).hasSize(1);
        assertThat(result.skippedCount()).isEqualTo(1);
        verify(workspaceArtifactRepository, times(1)).save(any());
    }

    @Test
    void confirm_auditFailure_doesNotPropagateException() {
        setupCompletedReport();
        doThrow(new RuntimeException("audit down")).when(auditService).record(any());
        var request = new ConversionModels.ConversionConfirmRequest(List.of(
            new ConversionModels.ConversionConfirmItem(
                "missing_or_unclear_requirements", 0, ConversionModels.ConversionIntent.CREATE_NEW)
        ));

        // Should NOT throw — audit failure is suppressed
        ConversionModels.ConversionResult result =
            service.confirm(REPORT_ID, ORG_ID, USER_ID, request);
        assertThat(result.createdArtifacts()).hasSize(1);
    }

    @Test
    void confirm_traceabilityFieldsPreserved() {
        setupCompletedReport();
        var request = new ConversionModels.ConversionConfirmRequest(List.of(
            new ConversionModels.ConversionConfirmItem(
                "missing_or_unclear_requirements", 0, ConversionModels.ConversionIntent.CREATE_NEW)
        ));

        service.confirm(REPORT_ID, ORG_ID, USER_ID, request);

        verify(workspaceArtifactRepository).save(argThat(row ->
            REPORT_ID.equals(row.sourceCheckupReportId())
            && "missing_or_unclear_requirements".equals(row.sourceSection())
            && row.sourceItemIndex() == 0
            && row.aiAssisted()
            && "DRAFT".equals(row.status())
        ));
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private void setupCompletedReport() {
        CheckupModels.CheckupReport report = reportWithOrg(ORG_ID);
        AiRunModels.AiRun aiRun = aiRunWithStatus(AiRunModels.AiRunStatus.completed);
        when(checkupRepository.findById(REPORT_ID)).thenReturn(Optional.of(report));
        when(aiRunRepository.findById(AI_RUN_ID)).thenReturn(Optional.of(aiRun));
    }

    private CheckupModels.CheckupReport reportWithOrg(String orgId) {
        return new CheckupModels.CheckupReport(
            REPORT_ID, AI_RUN_ID, orgId, USER_ID,
            CheckupModels.ReportStatus.DRAFT,
            CheckupModels.TargetType.FEATURE_DESCRIPTION, "https://example.com",
            "contexto", "objetivo",
            CheckupModels.CheckupDepth.STANDARD,
            List.of(new CheckupModels.FindingItem("Risco qualidade", "desc risco", CheckupModels.Severity.HIGH)),
            List.of(new CheckupModels.FindingItem("Validação de e-mail", "campo e-mail sem validação", CheckupModels.Severity.HIGH)),
            List.of(new CheckupModels.ScenarioItem("Login inválido", "testar login", CheckupModels.ScenarioType.NEGATIVE)),
            List.of(new CheckupModels.TestCaseItem("TC Login", "usuário logado", List.of("abrir app", "inserir dados"), "login ok")),
            List.of(new CheckupModels.FindingItem("Risco UX", "desc ux", CheckupModels.Severity.MEDIUM)),
            List.of(new CheckupModels.FindingItem("Nota release", "desc release", CheckupModels.Severity.LOW)),
            List.of(),
            null,
            Instant.now(), Instant.now()
        );
    }

    private AiRunModels.AiRun aiRunWithStatus(AiRunModels.AiRunStatus status) {
        return new AiRunModels.AiRun(
            AI_RUN_ID, ORG_ID, "proj_test", USER_ID,
            AiRunModels.AiRunFeature.checkup,
            null, null, null,
            0L, 0L, 0L,
            status, AiRunModels.AiRunFailureCategory.none,
            null, List.of(), null,
            Instant.now(), null, null
        );
    }

    private AiRunModels.AiRun aiRunWithProjectId(String projectId) {
        return new AiRunModels.AiRun(
            AI_RUN_ID, ORG_ID, projectId, USER_ID,
            AiRunModels.AiRunFeature.checkup,
            null, null, null,
            0L, 0L, 0L,
            AiRunModels.AiRunStatus.completed, AiRunModels.AiRunFailureCategory.none,
            null, List.of(), null,
            Instant.now(), null, null
        );
    }
}
