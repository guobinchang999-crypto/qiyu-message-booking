package com.qiyu.adapter.auth;

import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.auth.AuthAppService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {
    private final AuthAppService authAppService;

    public AuthController(AuthAppService authAppService) {
        this.authAppService = authAppService;
    }

    @PostMapping("/send-code")
    public ApiResponse<Map<String, Object>> sendCode(@Valid @RequestBody AuthSendCodeRequest request) {
        return ApiResponse.success(authAppService.sendCode(request.mobile()));
    }

    @PostMapping("/login")
    public ApiResponse<Map<String, Object>> login(@Valid @RequestBody AuthLoginRequest request) {
        return ApiResponse.success(authAppService.login(request.mobile(), request.code()));
    }
}
