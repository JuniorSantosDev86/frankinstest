package com.frankintest.api.airuns;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ActiveProfiles("test")
class AiRunLifecycleTest {

    @Autowired
    private AiRunRepository aiRunRepository;

    @Autowired
    private AiRunService aiRunService;

    private AiRunModels.AiRun createRun(String id) {
        return new AiRunModels.AiRun(
            id, "org_lifecycle", "proj_lifecycle", "user_lifecycle",
            AiRunModels.AiRunFeature.test_scenario_generation,
            AiRunModels.SourceArtifactType.business_rule, "rule_lc_001",
            "test input summary", 30L, 0L, 0L,
            AiRunModels.AiRunStatus.estimated, AiRunModels.AiRunFailureCategory.none,
            null, List.of(), Instant.now(), null, null
        );
    }

    @Test
    void insertRun_canBeFoundById() {
        String id = UUID.randomUUID().toString();
        aiRunRepository.insert(createRun(id));

        Optional<AiRunModels.AiRun> found = aiRunRepository.findById(id);
        assertThat(found).isPresent();
        assertThat(found.get().status()).isEqualTo(AiRunModels.AiRunStatus.estimated);
    }

    @Test
    void transitionToRunning_updatesStatusAndStartedAt() {
        String id = UUID.randomUUID().toString();
        aiRunRepository.insert(createRun(id));
        aiRunService.transitionToRunning(id);

        Optional<AiRunModels.AiRun> run = aiRunRepository.findById(id);
        assertThat(run.get().status()).isEqualTo(AiRunModels.AiRunStatus.running);
        assertThat(run.get().startedAt()).isNotNull();
    }

    @Test
    void transitionToCompleted_updatesStatusConsumedAndArtifacts() {
        String id = UUID.randomUUID().toString();
        aiRunRepository.insert(createRun(id));
        aiRunService.transitionToRunning(id);

        List<String> artifactIds = List.of("artifact_001", "artifact_002");
        aiRunService.transitionToCompleted(id, 5L, artifactIds);

        AiRunModels.AiRun run = aiRunRepository.findById(id).get();
        assertThat(run.status()).isEqualTo(AiRunModels.AiRunStatus.completed);
        assertThat(run.consumedCredits()).isEqualTo(5L);
        assertThat(run.outputArtifactIds()).containsExactlyElementsOf(artifactIds);
    }

    @Test
    void transitionToFailed_setsFailureCategoryAndZeroConsumed() {
        String id = UUID.randomUUID().toString();
        aiRunRepository.insert(createRun(id));
        aiRunService.transitionToRunning(id);
        aiRunService.transitionToFailed(id, AiRunModels.AiRunFailureCategory.provider);

        AiRunModels.AiRun run = aiRunRepository.findById(id).get();
        assertThat(run.status()).isEqualTo(AiRunModels.AiRunStatus.failed);
        assertThat(run.failureCategory()).isEqualTo(AiRunModels.AiRunFailureCategory.provider);
        assertThat(run.consumedCredits()).isEqualTo(0L);
    }

    @Test
    void findById_unknownId_returnsEmpty() {
        assertThat(aiRunRepository.findById("nonexistent_id_xyz")).isEmpty();
    }
}
