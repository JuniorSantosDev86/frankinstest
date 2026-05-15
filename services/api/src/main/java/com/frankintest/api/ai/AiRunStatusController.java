package com.frankintest.api.ai;

import com.frankintest.api.airuns.AiRunModels;
import com.frankintest.api.airuns.AiRunRepository;
import com.frankintest.api.ai.orchestration.AiTestDesignDtos;
import com.frankintest.api.system.ApiErrorResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/ai/runs")
public class AiRunStatusController {

    private final AiRunRepository aiRunRepository;

    public AiRunStatusController(AiRunRepository aiRunRepository) {
        this.aiRunRepository = aiRunRepository;
    }

    @GetMapping("/{aiRunId}")
    public ResponseEntity<?> getRunStatus(@PathVariable String aiRunId) {
        Optional<AiRunModels.AiRun> runOpt = aiRunRepository.findById(aiRunId);

        if (runOpt.isEmpty()) {
            return ResponseEntity.status(404)
                .body(ApiErrorResponse.of("RUN_NOT_FOUND", "AI run não encontrado: " + aiRunId));
        }

        AiRunModels.AiRun run = runOpt.get();
        return ResponseEntity.ok(new AiTestDesignDtos.AiRunStatusResponse(
            run.id(),
            run.status().name(),
            run.estimatedCredits(),
            run.consumedCredits(),
            run.failureCategory() != null ? run.failureCategory().name() : null,
            run.outputArtifactType() != null ? run.outputArtifactType().name() : null,
            run.outputArtifactIds()
        ));
    }
}
