package com.qiyu.adapter.auth;

import jakarta.validation.constraints.NotBlank;

/**
 * Unified login contract shared by the admin web application and mini program.
 * The client and grant types select an authentication strategy; identifier and
 * credential carry that strategy's account and secret without changing the API shape.
 */
public record AuthLoginRequest(
        String clientType,
        String grantType,
        String identifier,
        String credential,
        String mobile,
        String code
) { }
