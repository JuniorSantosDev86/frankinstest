package com.frankintest.api.conversion;

import java.util.List;

public final class ConversionEligibility {

    private ConversionEligibility() {}

    public record SectionMapping(String sectionName, String targetTable) {}

    // Canonical list of sections eligible for artifact conversion (defined in Bloco 13).
    // Shared by ConversionService and DriftService for MISSING_ARTIFACTS calculation.
    public static final List<SectionMapping> ELIGIBLE_SECTIONS = List.of(
        new SectionMapping("missing_or_unclear_requirements", "workspace_artifacts"),
        new SectionMapping("quality_risks",                   "workspace_artifacts"),
        new SectionMapping("ux_product_risks",                "workspace_artifacts"),
        new SectionMapping("release_readiness_notes",         "workspace_artifacts"),
        new SectionMapping("suggested_test_scenarios",        "test_scenarios"),
        new SectionMapping("suggested_test_cases",            "test_cases")
    );
}
