package com.qiyu.application.member;

import com.qiyu.application.auth.AuthContext;
import com.qiyu.application.auth.AuthPrincipal;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MemberProfileService {
    /** Returns the current customer's profile and member-center display data. */
    public MemberProfileVO currentProfile() {
        AuthPrincipal principal = AuthContext.current();
        return new MemberProfileVO(new MemberProfileVO.ProfileUser(principal.displayName(), maskMobile(principal.mobile()), "林", "栖愈银卡会员", "680.00", 2, 4),
                "我的", "⚙", "会员权益 · 全门店通用", "每一次停下来，都值得被温柔照顾",
                List.of("余额 ¥680.00", "套餐 4 次", "优惠券 2 张"),
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
}
