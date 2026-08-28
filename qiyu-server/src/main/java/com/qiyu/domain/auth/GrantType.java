package com.qiyu.domain.auth;

/** Authentication mechanisms accepted by the unified login contract. */
public enum GrantType {
    SMS_CODE,
    PASSWORD,
    WECHAT_CODE
}
