package com.qiyu.adapter.auth;

import cn.dev33.satoken.annotation.SaIgnore;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.auth.AuthAppService;
import com.qiyu.application.auth.AuthResponse;
import com.qiyu.application.auth.SendCodeResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;


@RestController
@RequestMapping("/auth")
public class AuthController {
    private final AuthAppService authAppService;

    public AuthController(AuthAppService authAppService) { this.authAppService = authAppService; }

    @SaIgnore
    @PostMapping("/send-code")
    public ApiResponse<SendCodeResponse> sendCode(@Valid @RequestBody AuthSendCodeRequest request) {
        return ApiResponse.success(authAppService.sendCode(request.mobile()));
    }

    @SaIgnore
    @PostMapping("/login")
    public ApiResponse<AuthResponse> login(@Valid @RequestBody AuthLoginRequest request) {
        if (request.clientType() == null && request.mobile() != null) {
            return ApiResponse.success(authAppService.login("MINI_PROGRAM", "SMS_CODE", request.mobile(), request.code()));
        }
        return ApiResponse.success(authAppService.login(request.clientType(), request.grantType(), request.identifier(), request.credential()));
    }

    @GetMapping("/me")
    public ApiResponse<AuthResponse> me() { return ApiResponse.success(authAppService.current()); }

    @PostMapping("/logout")
    public ApiResponse<Void> logout() { authAppService.logout(); return ApiResponse.success(null); }
}
