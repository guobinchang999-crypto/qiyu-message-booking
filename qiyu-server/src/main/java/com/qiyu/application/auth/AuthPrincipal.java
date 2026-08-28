package com.qiyu.application.auth;

import com.qiyu.domain.auth.DataAccessScope;
import com.qiyu.domain.auth.DataScopeType;
import com.qiyu.domain.auth.UserType;

import java.util.Set;
import java.util.List;

/**
 * Immutable authorization snapshot attached to one authenticated token session.
 *
 * <p>The snapshot contains both functional permissions and resolved data scopes. Callers must
 * still refresh it through {@link AuthAppService#refreshCurrentAccessContext()} before protected
 * requests when database-backed authentication is enabled.</p>
 */
public record AuthPrincipal(
        long userId,
        UserType userType,
        String customerId,
        String therapistId,
        Set<String> roles,
        Set<String> permissions,
        DataScopeType scopeType,
        Set<String> storeIds,
        Set<String> regionIds,
        List<DataAccessScope> dataScopes,
        Set<String> deniedPermissions,
        String displayName,
        String mobile
) {
    public boolean hasPermission(String permission) {
        // A direct or role-derived deny always wins, including over the super-user wildcard.
        return !deniedPermissions.contains(permission) && !deniedPermissions.contains("*")
                && (permissions.contains("*") || permissions.contains(permission));
    }

    /**
     * Resolves the operation-specific scope, falling back to the resource wildcard only.
     * Absence is represented by NONE so downstream filters fail closed.
     */
    public DataAccessScope scopeFor(String resourceCode, String actionCode) {
        return dataScopes.stream()
                .filter(scope -> scope.resourceCode().equals(resourceCode) && scope.actionCode().equals(actionCode))
                .findFirst()
                .or(() -> dataScopes.stream().filter(scope -> scope.resourceCode().equals(resourceCode) && scope.actionCode().equals("*")).findFirst())
                .orElseGet(() -> DataAccessScope.none(resourceCode, actionCode));
    }

    public boolean canAccessStore(String resourceCode, String actionCode, String storeId) {
        return scopeFor(resourceCode, actionCode).allowsStore(storeId);
    }
}
