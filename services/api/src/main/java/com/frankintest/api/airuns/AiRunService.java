package com.frankintest.api.airuns;

import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class AiRunService {

    private final AiRunRepository repository;

    public AiRunService(AiRunRepository repository) {
        this.repository = repository;
    }

    public Optional<AiRunModels.AiRun> findById(String id) {
        return repository.findById(id);
    }

    public void transitionToRunning(String id) {
        repository.updateToRunning(id, Instant.now());
    }

    public void transitionToCompleted(String id, long consumedCredits, List<String> outputArtifactIds) {
        repository.updateStatus(id, AiRunModels.AiRunStatus.completed,
            AiRunModels.AiRunFailureCategory.none, consumedCredits, outputArtifactIds, Instant.now());
    }

    public void transitionToFailed(String id, AiRunModels.AiRunFailureCategory failureCategory) {
        repository.updateStatus(id, AiRunModels.AiRunStatus.failed,
            failureCategory, 0L, List.of(), Instant.now());
    }
}
