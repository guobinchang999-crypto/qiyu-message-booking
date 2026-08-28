package com.qiyu.adapter.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;

import java.util.Map;

@RestController
@RequestMapping("")
public class HealthController {
    private final boolean persistenceEnabled;

    public HealthController(@Value("${qiyu.auth.persistence:false}") boolean persistenceEnabled) {
        this.persistenceEnabled = persistenceEnabled;
    }

    @GetMapping("/health")
    public ApiResponse<Map<String, String>> health() {
        return ApiResponse.success(Map.of("service", "qiyu-server",
                "mode", persistenceEnabled ? "local-mysql" : "mock", "status", "UP"));
    }
}
