package com.qiyu.adapter.common;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Value;


@RestController
@RequestMapping("")
public class HealthController {
    private final boolean persistenceEnabled;

    public HealthController(@Value("${qiyu.auth.persistence:false}") boolean persistenceEnabled) {
        this.persistenceEnabled = persistenceEnabled;
    }

    @GetMapping("/health")
    /** Returns the liveness status and active persistence mode. */
    public ApiResponse<HealthResponse> health() {
        return ApiResponse.success(new HealthResponse("qiyu-server",
                persistenceEnabled ? "local-mysql" : "mock", "UP"));
    }
}
