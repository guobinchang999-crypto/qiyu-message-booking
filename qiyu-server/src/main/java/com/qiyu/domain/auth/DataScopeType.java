package com.qiyu.domain.auth;

/** Supported row-level access boundaries, ordered here by meaning rather than privilege strength. */
public enum DataScopeType {
    NONE,
    SELF,
    PRIMARY_STORE,
    ASSIGNED_STORES,
    REGION_STORES,
    STORE,
    ALL_STORES
}
