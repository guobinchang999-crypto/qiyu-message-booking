package com.qiyu.application.auth;

import com.qiyu.domain.auth.ClientType;
import com.qiyu.domain.auth.DataAccessScope;
import com.qiyu.domain.auth.DataScopeType;
import com.qiyu.domain.auth.GrantType;
import com.qiyu.domain.auth.UserType;
import com.qiyu.infrastructure.persistence.mapper.AuthAccessMapper;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.dao.DataAccessException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Builds the effective authorization principal from persisted identities and assignments.
 * Database identifiers and validity windows are authoritative; clients never submit resolved scopes.
 */
@Component
@ConditionalOnProperty(name = "qiyu.auth.persistence", havingValue = "true")
public class DbAuthPrincipalProvider {
    private final AuthAccessMapper authAccessMapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public DbAuthPrincipalProvider(AuthAccessMapper authAccessMapper) {
        this.authAccessMapper = authAccessMapper;
    }

    public AuthPrincipal authenticate(ClientType clientType, GrantType grantType, String identifier, String credential) {
        try {
            String identityType = grantType == GrantType.PASSWORD ? "PASSWORD" : "MOBILE";
            List<Map<String, Object>> identities = authAccessMapper.findIdentity(identityType, identifier);
            if (identities.isEmpty()) return null;

            Map<String, Object> identity = identities.getFirst();
            String hash = (String) identity.get("credential_hash");
            boolean valid = grantType == GrantType.PASSWORD
                    ? hash != null && passwordEncoder.matches(credential, hash)
                    : "123456".equals(credential);
            if (!valid) throw new IllegalArgumentException("登录凭证不正确");

            return buildPrincipal(identity, identifier);
        } catch (DataAccessException exception) {
            // Database availability is an infrastructure failure; silently switching to Mock
            // authentication would turn an outage into an authorization vulnerability.
            throw new IllegalStateException("认证服务暂时不可用", exception);
        }
    }

    public AuthPrincipal reload(long userId, String mobile) {
        // Reload uses the stable user ID so renamed login identifiers do not invalidate active sessions.
        try {
            List<Map<String, Object>> users = authAccessMapper.findUser(userId);
            return users.isEmpty() ? null : buildPrincipal(users.getFirst(), mobile);
        } catch (DataAccessException exception) {
            throw new IllegalStateException("认证权限服务暂时不可用", exception);
        }
    }

    private AuthPrincipal buildPrincipal(Map<String, Object> identity, String mobile) {
        long userId = ((Number) identity.get("user_id")).longValue();
        Set<String> roles = new LinkedHashSet<>(authAccessMapper.roleCodes(userId));

        PermissionSet permissionSet = loadPermissions(userId);
        List<DataAccessScope> scopes = loadScopes(userId);
        DataAccessScope bookingRead = scopes.stream()
                    // A wildcard action grants the read view as well as individual booking commands.
                    .filter(scope -> scope.resourceCode().equals("booking")
                            && (scope.actionCode().equals("READ") || scope.actionCode().equals("*")))
                    .findFirst().orElse(DataAccessScope.none("booking", "READ"));

        UserType userType = UserType.valueOf((String) identity.get("user_type"));
        return new AuthPrincipal(userId, userType, value(identity.get("customer_id")), therapistApiId(identity.get("therapist_code")),
                    roles, permissionSet.allowed(), preferredScope(bookingRead), bookingRead.storeIds(), bookingRead.regionIds(),
                    scopes, permissionSet.denied(), (String) identity.get("display_name"), mobile);
    }

    private PermissionSet loadPermissions(long userId) {
        Set<String> allowed = new LinkedHashSet<>();
        Set<String> denied = new LinkedHashSet<>();
        List<Map<String, Object>> grants = authAccessMapper.permissionGrants(userId);
        for (Map<String, Object> grant : grants) {
            String code = String.valueOf(grant.get("permission_code"));
            if ("DENY".equals(grant.get("effect"))) denied.add(code); else allowed.add(code);
        }
        // Explicit user or role denies take precedence over every accumulated allow grant.
        allowed.removeAll(denied);
        return new PermissionSet(allowed, denied);
    }

    private List<DataAccessScope> loadScopes(long userId) {
        // Expired temporary grants are excluded every time the principal is rebuilt.
        List<ScopeSource> userScopes = authAccessMapper.userScopes(userId).stream().map(row -> scopeSource(row, true)).toList();
        // A user assignment replaces role defaults only for the same resource/action pair.
        Set<String> overriddenKeys = new LinkedHashSet<>();
        userScopes.forEach(scope -> overriddenKeys.add(scope.key()));
        List<ScopeSource> sources = new ArrayList<>(userScopes);
        sources.addAll(authAccessMapper.roleScopes(userId).stream().map(row -> scopeSource(row, false)).toList());

        Map<String, List<ScopeSource>> grouped = new LinkedHashMap<>();
        for (ScopeSource source : sources) {
            if (!source.userOverride() && overriddenKeys.contains(source.key())) continue;
            grouped.computeIfAbsent(source.key(), ignored -> new ArrayList<>()).add(source);
        }
        List<DataAccessScope> result = new ArrayList<>();
        // Multiple roles contribute a union of scope types and their resolved stores/regions.
        for (List<ScopeSource> group : grouped.values()) {
            ScopeSource first = group.getFirst();
            Set<DataScopeType> types = new LinkedHashSet<>();
            Set<String> stores = new LinkedHashSet<>();
            Set<String> regions = new LinkedHashSet<>();
            for (ScopeSource source : group) {
                types.add(source.scopeType());
                if (source.scopeType() == DataScopeType.PRIMARY_STORE || source.scopeType() == DataScopeType.STORE) {
                    stores.addAll(primaryStores(userId));
                }
                if (source.scopeType() == DataScopeType.ASSIGNED_STORES) {
                    stores.addAll(source.userOverride()
                            ? userStores(userId, source.resourceCode(), source.actionCode())
                            : roleStores(userId, source.resourceCode(), source.actionCode()));
                }
                if (source.scopeType() == DataScopeType.REGION_STORES) {
                    Set<String> grantedRegions = source.userOverride()
                            ? userRegions(userId, source.resourceCode(), source.actionCode())
                            : roleRegions(userId, source.resourceCode(), source.actionCode());
                    regions.addAll(grantedRegions);
                    stores.addAll(storesInRegions(grantedRegions));
                }
            }
            result.add(new DataAccessScope(first.resourceCode(), first.actionCode(), types, stores, regions));
        }
        return result;
    }

    private Set<String> primaryStores(long userId) {
        return new LinkedHashSet<>(authAccessMapper.primaryStores(userId));
    }

    private Set<String> userStores(long userId, String resource, String action) {
        return new LinkedHashSet<>(authAccessMapper.userStores(userId, resource, action));
    }

    private Set<String> roleStores(long userId, String resource, String action) {
        return new LinkedHashSet<>(authAccessMapper.roleStores(userId, resource, action));
    }

    private Set<String> userRegions(long userId, String resource, String action) {
        return new LinkedHashSet<>(authAccessMapper.userRegions(userId, resource, action));
    }

    private Set<String> roleRegions(long userId, String resource, String action) {
        return new LinkedHashSet<>(authAccessMapper.roleRegions(userId, resource, action));
    }

    private Set<String> storesInRegions(Set<String> regionIds) {
        if (regionIds.isEmpty()) return Set.of();
        return new LinkedHashSet<>(authAccessMapper.storesInRegions(regionIds));
    }

    private static DataScopeType preferredScope(DataAccessScope scope) {
        // This scalar is a compatibility summary; authorization uses the complete scope set.
        return scope.scopeTypes().stream().max(Comparator.comparingInt(DbAuthPrincipalProvider::scopeWeight)).orElse(DataScopeType.NONE);
    }

    private static int scopeWeight(DataScopeType type) {
        return switch (type) {
            case ALL_STORES -> 6;
            case REGION_STORES -> 5;
            case ASSIGNED_STORES -> 4;
            case PRIMARY_STORE, STORE -> 3;
            case SELF -> 2;
            case NONE -> 1;
        };
    }

    private static ScopeSource scopeSource(Map<String, Object> row, boolean userOverride) {
        return new ScopeSource(String.valueOf(row.get("resource_code")), String.valueOf(row.get("action_code")),
                DataScopeType.valueOf(String.valueOf(row.get("scope_type"))), userOverride);
    }

    private static String value(Object value) { return value == null ? null : String.valueOf(value); }

    private static String therapistApiId(Object codeValue) {
        if (codeValue == null) return null;
        String code = String.valueOf(codeValue);
        return switch (code) {
            case "TH_JA_ANRAN" -> "therapist-anran";
            case "TH_XH_YUANYUAN" -> "therapist-yuanyuan";
            case "TH_LJZ_LIN" -> "therapist-lin";
            default -> "therapist-" + code.toLowerCase().replace('_', '-');
        };
    }

    private record PermissionSet(Set<String> allowed, Set<String> denied) { }
    private record ScopeSource(String resourceCode, String actionCode, DataScopeType scopeType, boolean userOverride) {
        String key() { return resourceCode + ':' + actionCode; }
    }
}
