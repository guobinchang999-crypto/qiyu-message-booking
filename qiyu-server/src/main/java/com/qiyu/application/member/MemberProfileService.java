package com.qiyu.application.member;

import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MemberProfileService {
    public Map<String, Object> currentProfile() {
        return Map.ofEntries(
                Map.entry("user", Map.of(
                        "name", "林知夏",
                        "phone", "138****1288",
                        "avatarText", "林",
                        "level", "栖愈银卡会员",
                        "balanceText", "680.00",
                        "couponCount", 2,
                        "packageCount", 4
                )),
                Map.entry("title", "我的"),
                Map.entry("settingsIcon", "⚙"),
                Map.entry("memberTitle", "会员权益 · 全门店通用"),
                Map.entry("memberSubtitle", "每一次停下来，都值得被温柔照顾"),
                Map.entry("memberStats", List.of("余额 ¥680.00", "套餐 4 次", "优惠券 2 张")),
                Map.entry("shortcuts", List.of(
                        Map.of("key", "orders", "title", "预约", "subtitle", "我的预约"),
                        Map.of("key", "coupons", "title", "券", "subtitle", "优惠券"),
                        Map.of("key", "packages", "title", "卡", "subtitle", "套餐卡"),
                        Map.of("key", "favorites", "title", "♡", "subtitle", "收藏")
                )),
                Map.entry("recentBookingTitle", "最近预约"),
                Map.entry("recentBookingActionText", "查看详情 ›"),
                Map.entry("menuItems", List.of(
                        Map.of("key", "orders", "label", "最近预约", "valueText", "查看全部 ›"),
                        Map.of("key", "contacts", "label", "常用联系人", "valueText", "›"),
                        Map.of("key", "support", "label", "联系客服", "valueText", "›"),
                        Map.of("key", "settings", "label", "设置", "valueText", "›")
                )),
                Map.entry("logoutText", "退出登录"),
                Map.entry("logoutModalTitle", "退出登录"),
                Map.entry("logoutModalContent", "退出后将回到登录页，当前预约记录不会被删除。"),
                Map.entry("logoutConfirmText", "退出"),
                Map.entry("logoutCancelText", "取消")
        );
    }
}
