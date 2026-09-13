package com.qiyu.application.member.dto;

import java.util.List;

/** Typed member-center response for the mini program profile page. */
public record MemberProfileVO(ProfileUser user, String title, String settingsIcon, String memberTitle,
                              String memberSubtitle, List<String> memberStats, List<Shortcut> shortcuts,
                              String recentBookingTitle, String recentBookingActionText, List<MenuItem> menuItems,
                              String logoutText, String logoutModalTitle, String logoutModalContent,
                              String logoutConfirmText, String logoutCancelText) {
    public record ProfileUser(String name, String phone, String avatarText, String level,
                              String balanceText, int couponCount, int packageCount) {}
    public record Shortcut(String key, String title, String subtitle) {}
    public record MenuItem(String key, String label, String valueText) {}
}
