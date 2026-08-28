package com.qiyu.application.auth;

import java.util.List;
import java.util.Set;

/** Typed authentication response shared by admin web and mini program clients. */
public record AuthResponse(String accessToken, String token, String tokenType, int expiresIn,
                           PrincipalView principal, UserSummary user) {
    public record PrincipalView(long userId, String userType, String displayName, String mobile,
                                String customerId, String therapistId, Set<String> roles,
                                Set<String> permissions, List<String> fieldPermissionCodes,
                                Set<String> deniedPermissionCodes, List<StoreScopeView> storeScopes,
                                ScopeView dataScope) {}
    public record ScopeView(String scopeType, Set<String> storeIds, Set<String> regionIds) {}
    public record StoreScopeView(String resourceCode, String actionCode, Set<String> scopeTypes,
                                 Set<String> storeIds, Set<String> regionIds) {}
    public record UserSummary(String mobile, String displayName) {}
}
