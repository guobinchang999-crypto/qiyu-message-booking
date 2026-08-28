package com.qiyu.adapter.common;

/** Basic service health response. */
public record HealthResponse(String service, String mode, String status) {}
