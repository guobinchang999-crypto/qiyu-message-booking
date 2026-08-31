package com.qiyu.adapter.common;

import jakarta.validation.ConstraintViolationException;
import cn.dev33.satoken.exception.NotLoginException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Converts input and validation failures into a stable client error contract. */
    @ExceptionHandler({IllegalArgumentException.class, ConstraintViolationException.class})
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(Exception exception) {
        LOGGER.warn("Request rejected by {}: {}", exception.getClass().getSimpleName(), exception.getMessage());
        LOGGER.debug("Rejected request details", exception);
        String message = exception.getMessage() == null || exception.getMessage().isBlank()
                ? "请求参数或业务状态不正确" : exception.getMessage();
        return ResponseEntity.badRequest().body(ApiResponse.failure(400, message));
    }

    /** Hides protected resources while preserving the authorization failure message. */
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(SecurityException exception) {
        return ResponseEntity.status(403).body(ApiResponse.failure(403, exception.getMessage()));
    }

    /** Normalizes Sa-Token login failures without exposing framework-specific details. */
    @ExceptionHandler(NotLoginException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(NotLoginException exception) {
        return ResponseEntity.status(401).body(ApiResponse.failure(401, "请先登录"));
    }

    /** Logs infrastructure failures with their causes while returning a stable unavailable response. */
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleServiceUnavailable(IllegalStateException exception) {
        LOGGER.error("Request failed because a required service is unavailable", exception);
        return ResponseEntity.status(503).body(ApiResponse.failure(503, exception.getMessage()));
    }
}
