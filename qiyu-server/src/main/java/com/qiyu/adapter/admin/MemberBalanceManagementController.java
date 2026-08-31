package com.qiyu.adapter.admin;

import cn.dev33.satoken.annotation.SaCheckLogin;
import com.qiyu.adapter.common.ApiResponse;
import com.qiyu.application.member.MemberBalanceService;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Administration adapter for explicit and auditable member balance adjustments. */
@RestController
@RequestMapping("/admin/members")
@SaCheckLogin
public class MemberBalanceManagementController {
    private final MemberBalanceService memberBalanceService;

    public MemberBalanceManagementController(MemberBalanceService memberBalanceService) {
        this.memberBalanceService = memberBalanceService;
    }

    /**
     * Applies a credit or debit using the caller-provided request ID as an idempotency key.
     * Functional and data-scope authorization are enforced in the application service.
     */
    @PostMapping("/{memberId}/balance-adjustments")
    public ApiResponse<MemberBalanceService.AdjustmentResult> adjustBalance(
            @PathVariable String memberId,
            @RequestBody MemberBalanceService.AdjustmentCommand command
    ) {
        return ApiResponse.success(memberBalanceService.adjust(memberId, command));
    }
}
