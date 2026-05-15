package com.frankintest.api.system;

public record ApiErrorResponse(
    String code,
    String message,
    String aiRunId
) {
    public static ApiErrorResponse of(String code, String message) {
        return new ApiErrorResponse(code, message, null);
    }

    public static ApiErrorResponse of(String code, String message, String aiRunId) {
        return new ApiErrorResponse(code, message, aiRunId);
    }
}
