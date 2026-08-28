package com.qiyu.adapter.member;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.member.MemberProfileService;
import com.qiyu.application.member.MemberProfileVO;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/member")
@SaCheckLogin
public class MemberController {
    private final MemberProfileService memberProfileService;

    public MemberController(MemberProfileService memberProfileService) {
        this.memberProfileService = memberProfileService;
    }

    @GetMapping("/profile")
    public ApiResponse<MemberProfileVO> profile() {
        return ApiResponse.success(memberProfileService.currentProfile());
    }
}
