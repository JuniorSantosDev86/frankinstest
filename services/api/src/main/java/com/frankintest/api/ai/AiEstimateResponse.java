package com.frankintest.api.ai;

public record AiEstimateResponse(
        long estimatedCredits,
        String pricingNote
) {}
