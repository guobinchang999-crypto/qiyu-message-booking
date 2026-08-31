package com.qiyu.application.member;

import com.qiyu.application.member.dto.MemberProfileVO;

import com.qiyu.application.auth.AuthContext;
import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.application.auth.AuthAppService;
import com.qiyu.domain.member.gateway.MemberProfileGateway;
import org.springframework.stereotype.Service;

import java.math.RoundingMode;
import java.util.List;

@Service
public class MemberProfileService {
    private final AuthAppService authAppService;
    private final MemberProfileGateway memberProfileGateway;

    public MemberProfileService(AuthAppService authAppService, MemberProfileGateway memberProfileGateway) {
        this.authAppService = authAppService;
        this.memberProfileGateway = memberProfileGateway;
    }

    /** Returns the current customer's profile and member-center display data. */
    public MemberProfileVO currentProfile() {
        AuthPrincipal principal = authAppService.requireCustomer();
        MemberProfileGateway.MemberProfile profile = memberProfileGateway.findByUserId(principal.userId())
                .orElseThrow(() -> new IllegalStateException("当前用户尚未建立会员资料"));
        String balanceText = profile.balance().setScale(2, RoundingMode.HALF_UP).toPlainString();
        String level = memberLevelLabel(profile.memberLevel());
        return new MemberProfileVO(new MemberProfileVO.ProfileUser(profile.displayName(), maskMobile(profile.mobile()), avatarText(profile.displayName()), level,
                balanceText, profile.couponCount(), profile.packageRemainingTimes()),
                "我的", "⚙", "会员权益 · 全门店通用", "每一次停下来，都值得被温柔照顾",
                List.of("余额 ¥" + balanceText, "套餐 " + profile.packageRemainingTimes() + " 次", "优惠券 " + profile.couponCount() + " 张"),
                List.of(new MemberProfileVO.Shortcut("orders", "预约", "我的预约"), new MemberProfileVO.Shortcut("coupons", "券", "优惠券"),
                        new MemberProfileVO.Shortcut("packages", "卡", "套餐卡"), new MemberProfileVO.Shortcut("favorites", "♡", "收藏")),
                "最近预约", "查看详情 ›", List.of(new MemberProfileVO.MenuItem("orders", "最近预约", "查看全部 ›"),
                        new MemberProfileVO.MenuItem("contacts", "常用联系人", "›"), new MemberProfileVO.MenuItem("support", "联系客服", "›"),
                        new MemberProfileVO.MenuItem("settings", "设置", "›")), "退出登录", "退出登录",
                "退出后将回到登录页，当前预约记录不会被删除。", "退出", "取消");
    }

    private static String maskMobile(String mobile) {
        if (mobile == null || mobile.length() < 7) return "";
        return mobile.substring(0, 3) + "****" + mobile.substring(mobile.length() - 4);
    }

    private static String avatarText(String displayName) {
        return displayName == null || displayName.isBlank() ? "会" : displayName.substring(0, 1);
    }

    private static String memberLevelLabel(String level) {
        return switch (level == null ? "" : level) {
            case "SILVER" -> "栖愈银卡会员";
            case "GOLD" -> "栖愈金卡会员";
            case "PLATINUM" -> "栖愈铂金会员";
            default -> "栖愈会员";
        };
    }
}
