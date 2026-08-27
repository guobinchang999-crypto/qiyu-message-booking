package com.qiyu.adapter.auth;

import jakarta.validation.constraints.NotBlank;

public record AuthLoginRequest(
        String clientType,
        String grantType,
        String identifier,
        String credential,
        String mobile,
        String code
) { }
