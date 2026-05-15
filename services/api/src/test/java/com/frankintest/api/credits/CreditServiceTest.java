package com.frankintest.api.credits;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@ActiveProfiles("test")
class CreditServiceTest {

    @Autowired
    private CreditRepository creditRepository;

    @Test
    void getOrCreateBalance_newOrg_seedsInitialBalance() {
        String orgId = "org_" + UUID.randomUUID();
        CreditModels.CreditBalance balance = creditRepository.getOrCreateBalance(orgId);
        assertThat(balance.availableCredits()).isGreaterThan(0);
    }

    @Test
    void reserve_sufficientCredits_reducesAvailableAndIncreasesReserved() {
        String orgId = "org_" + UUID.randomUUID();
        String aiRunId = UUID.randomUUID().toString();
        creditRepository.getOrCreateBalance(orgId);

        CreditModels.CreditBalance before = creditRepository.getOrCreateBalance(orgId);
        creditRepository.reserve(orgId, "user_test", aiRunId, 30, "Reserva de teste");
        CreditModels.CreditBalance after = creditRepository.getOrCreateBalance(orgId);

        assertThat(after.availableCredits()).isEqualTo(before.availableCredits() - 30);
        assertThat(after.reservedCredits()).isEqualTo(before.reservedCredits() + 30);
    }

    @Test
    void reserve_insufficientCredits_throwsInsufficientCreditsException() {
        String orgId = "org_" + UUID.randomUUID();
        String aiRunId = UUID.randomUUID().toString();
        // Create org with default balance then exhaust it
        creditRepository.getOrCreateBalance(orgId);

        assertThatThrownBy(() ->
            creditRepository.reserve(orgId, "user_test", aiRunId, 999_999_999L, "Test limit")
        ).isInstanceOf(CreditModels.InsufficientCreditsException.class);
    }

    @Test
    void capture_consumedLessThanReserved_releasesRemainder() {
        String orgId = "org_" + UUID.randomUUID();
        String aiRunId = UUID.randomUUID().toString();
        creditRepository.getOrCreateBalance(orgId);

        creditRepository.reserve(orgId, "user_test", aiRunId, 30, "Reserva de teste");
        CreditModels.CreditBalance beforeCapture = creditRepository.getOrCreateBalance(orgId);

        creditRepository.capture(orgId, "user_test", aiRunId, 10, 30, "Captura de teste");
        CreditModels.CreditBalance afterCapture = creditRepository.getOrCreateBalance(orgId);

        // Reserved goes back to 0, available recovers the unused 20
        assertThat(afterCapture.reservedCredits()).isEqualTo(beforeCapture.reservedCredits() - 30);
        assertThat(afterCapture.availableCredits()).isEqualTo(beforeCapture.availableCredits() + 20);
    }

    @Test
    void release_platformFailure_restoresCreditsToAvailable() {
        String orgId = "org_" + UUID.randomUUID();
        String aiRunId = UUID.randomUUID().toString();
        creditRepository.getOrCreateBalance(orgId);

        creditRepository.reserve(orgId, "user_test", aiRunId, 40, "Reserva");
        CreditModels.CreditBalance afterReserve = creditRepository.getOrCreateBalance(orgId);

        creditRepository.release(orgId, "user_test", aiRunId, 40, "Liberação por falha de plataforma");
        CreditModels.CreditBalance afterRelease = creditRepository.getOrCreateBalance(orgId);

        assertThat(afterRelease.availableCredits()).isEqualTo(afterReserve.availableCredits() + 40);
        assertThat(afterRelease.reservedCredits()).isEqualTo(afterReserve.reservedCredits() - 40);
    }
}
