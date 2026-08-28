package com.qiyu.domain.auth;

import java.util.Set;

/**
 * Effective data range for one resource operation.
 * Store and region identifiers are resolved from trusted assignments on the server.
 */
public record DataAccessScope(
        String resourceCode,
        String actionCode,
        Set<DataScopeType> scopeTypes,
        Set<String> storeIds,
        Set<String> regionIds
) {
    public static DataAccessScope none(String resourceCode, String actionCode) {
        // Missing scope configuration must fail closed instead of becoming implicit global access.
        return new DataAccessScope(resourceCode, actionCode, Set.of(DataScopeType.NONE), Set.of(), Set.of());
    }

    public boolean allowsAllStores() {
        return scopeTypes.contains(DataScopeType.ALL_STORES);
    }

    public boolean allowsSelf() {
        return scopeTypes.contains(DataScopeType.SELF);
    }

    public boolean allowsStore(String storeId) {
        return allowsAllStores() || storeIds.contains(storeId);
    }
}
