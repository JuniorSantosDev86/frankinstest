package com.frankintest.api.toolrecommendation;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.frankintest.api.checkup.CheckupModels;
import com.frankintest.api.checkup.CheckupRepository;
import com.frankintest.api.conversion.ConversionModels;
import com.frankintest.api.conversion.WorkspaceArtifactRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class ToolRecommendationService {

    private final CheckupRepository checkupRepository;
    private final WorkspaceArtifactRepository workspaceArtifactRepository;
    private final ToolRecommendationEngine engine;
    private final ObjectMapper objectMapper;

    public ToolRecommendationService(
            CheckupRepository checkupRepository,
            WorkspaceArtifactRepository workspaceArtifactRepository,
            ToolRecommendationEngine engine,
            ObjectMapper objectMapper) {
        this.checkupRepository = checkupRepository;
        this.workspaceArtifactRepository = workspaceArtifactRepository;
        this.engine = engine;
        this.objectMapper = objectMapper;
    }

    public ToolRecommendationModels.ToolRecommendationResult generate(String reportId, String organizationId) {
        CheckupModels.CheckupReport report = checkupRepository.findById(reportId)
            .orElseThrow(() -> new ToolRecommendationModels.ReportNotFoundException(reportId));

        if (!report.organizationId().equals(organizationId)) {
            throw new ToolRecommendationModels.ReportNotFoundException(reportId);
        }

        if (report.status() != CheckupModels.ReportStatus.DRAFT
                && report.status() != CheckupModels.ReportStatus.REVIEWED) {
            throw new ToolRecommendationModels.ReportNotReadyException(reportId);
        }

        return engine.compute(report);
    }

    public ToolRecommendationModels.WorkspaceArtifactSaveResponse save(
            String reportId, String organizationId, String userId) {

        ToolRecommendationModels.ToolRecommendationResult result = generate(reportId, organizationId);

        String details;
        try {
            details = objectMapper.writeValueAsString(result);
        } catch (JsonProcessingException e) {
            details = "{}";
        }

        String artifactId = UUID.randomUUID().toString();
        Instant createdAt = Instant.now();
        String shortReportId = reportId.length() > 8 ? reportId.substring(0, 8) : reportId;
        String title = "Recomendações de ferramentas de QA — " + shortReportId;

        ConversionModels.WorkspaceArtifactRow row = new ConversionModels.WorkspaceArtifactRow(
            artifactId,
            organizationId,
            null,
            "QA_ACTION",
            title,
            "Recomendações geradas automaticamente para o relatório de Check-up.",
            "DRAFT",
            false,
            reportId,
            null,
            "tool-recommendations",
            0,
            details,
            userId,
            createdAt,
            createdAt
        );

        workspaceArtifactRepository.save(row);

        return new ToolRecommendationModels.WorkspaceArtifactSaveResponse(
            artifactId,
            "QA_ACTION",
            title,
            "DRAFT",
            createdAt
        );
    }
}
