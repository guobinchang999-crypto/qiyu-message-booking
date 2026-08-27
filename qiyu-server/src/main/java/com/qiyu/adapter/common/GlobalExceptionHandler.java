package com.qiyu.adapter.common;

import jakarta.validation.ConstraintViolationException;
import cn.dev33.satoken.exception.NotLoginException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({IllegalArgumentException.class, ConstraintViolationException.class})
    public ResponseEntity<ApiResponse<Void>> handleBadRequest(Exception exception) {
        return ResponseEntity.badRequest().body(ApiResponse.failure(400, exception.getMessage()));
    }

    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<ApiResponse<Void>> handleForbidden(SecurityException exception) {
        return ResponseEntity.status(403).body(ApiResponse.failure(403, exception.getMessage()));
    }

    @ExceptionHandler(NotLoginException.class)
    public ResponseEntity<ApiResponse<Void>> handleUnauthorized(NotLoginException exception) {
        return ResponseEntity.status(401).body(ApiResponse.failure(401, "请先登录"));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ApiResponse<Void>> handleServiceUnavailable(IllegalStateException exception) {
        return ResponseEntity.status(503).body(ApiResponse.failure(503, exception.getMessage()));
    }
}
