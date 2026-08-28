package com.qiyu.application.auth;

import cn.dev33.satoken.stp.StpUtil;

/** Provides the principal stored in the current Sa-Token session. */
public final class AuthContext {
    private AuthContext() { }

    public static AuthPrincipal current() {
        if (!StpUtil.isLogin()) {
            throw new IllegalStateException("请先登录");
        }
        // The login identifier alone is insufficient: authorization depends on this full snapshot.
        Object principal = StpUtil.getTokenSession().get("principal");
        if (!(principal instanceof AuthPrincipal authPrincipal)) {
            throw new IllegalStateException("登录会话无效");
        }
        return authPrincipal;
    }
}
