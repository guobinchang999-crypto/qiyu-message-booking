package com.qiyu.adapter.member;

import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.member.MemberProfileService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/member")
public class MemberController {
    private final MemberProfileService memberProfileService;

    public MemberController(MemberProfileService memberProfileService) {
        this.memberProfileService = memberProfileService;
    }

    @GetMapping("/profile")
    public ApiResponse<Map<String, Object>> profile() {
        return ApiResponse.success(memberProfileService.currentProfile());
    }
}
