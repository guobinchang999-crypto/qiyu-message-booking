package com.qiyu.application.auth;

import cn.dev33.satoken.stp.SaLoginModel;
import cn.dev33.satoken.stp.StpUtil;
import com.qiyu.domain.auth.ClientType;
import com.qiyu.domain.auth.DataAccessScope;
import com.qiyu.domain.auth.DataScopeType;
import com.qiyu.domain.auth.GrantType;
import com.qiyu.domain.auth.UserType;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/** Authentication service uses deterministic mock identities until persistence is configured. */
@Service
public class AuthAppService {
    private static final String MOCK_CODE = "123456";
    private final ConcurrentMap<String, String> verificationCodes = new ConcurrentHashMap<>();
    private final ConcurrentMap<String, AuthPrincipal> principals = new ConcurrentHashMap<>();
    private final DbAuthPrincipalProvider dbAuthPrincipalProvider;
    @Value("${qiyu.auth.mock-admin-password}")
    private String mockAdminPassword;

    public AuthAppService(ObjectProvider<DbAuthPrincipalProvider> dbAuthPrincipalProvider) {
        this.dbAuthPrincipalProvider = dbAuthPrincipalProvider.getIfAvailable();
    }

    public Map<String, Object> sendCode(String mobile) {
        String requestId = "LOGIN-" + UUID.randomUUID();
        verificationCodes.put(mobile, MOCK_CODE);
        return Map.of("mobile", mobile, "requestId", requestId, "expiresIn", 60,
                "verificationCode", MOCK_CODE, "mock", true);
    }

    public Map<String, Object> login(String clientTypeValue, String grantTypeValue, String identifier, String credential) {
        ClientType clientType = parse(ClientType.class, clientTypeValue, "客户端类型不正确");
        GrantType grantType = parse(GrantType.class, grantTypeValue, "登录方式不正确");
        AuthPrincipal principal = authenticate(clientType, grantType, identifier, credential);
        StpUtil.login(principal.userId(), new SaLoginModel().setTimeout(7200));
        StpUtil.getTokenSession().set("principal", principal);
        String token = StpUtil.getTokenValue();
        principals.put(token, principal);
        return response(token, principal);
    }

    public Map<String, Object> current() {
        refreshCurrentAccessContext();
        AuthPrincipal principal = AuthContext.current();
        return response(StpUtil.getTokenValue(), principal);
    }

    public void logout() {
        String token = StpUtil.getTokenValue();
        principals.remove(token);
        StpUtil.logout();
    }

    /** Database-mode requests refresh scopes so revoked and expired grants take effect without re-login. */
    public void refreshCurrentAccessContext() {
        if (dbAuthPrincipalProvider == null || !StpUtil.isLogin()) return;
        AuthPrincipal current = AuthContext.current();
        AuthPrincipal refreshed = dbAuthPrincipalProvider.reload(current.userId(), current.mobile());
        if (refreshed != null) {
            StpUtil.getTokenSession().set("principal", refreshed);
            principals.put(StpUtil.getTokenValue(), refreshed);
        }
    }

    public AuthPrincipal requireAdmin() {
        AuthPrincipal principal = AuthContext.current();
        if (principal.userType() != UserType.STAFF) {
            throw new SecurityException("当前用户无后台访问权限");
        }
        return principal;
    }

    public AuthPrincipal requirePermission(String permission) {
        AuthPrincipal principal = requireAdmin();
        if (!principal.hasPermission(permission)) {
            throw new SecurityException("没有权限执行该操作");
        }
        return principal;
    }

    public AuthPrincipal requireCustomer() {
        AuthPrincipal principal = AuthContext.current();
        if (principal.userType() != UserType.CUSTOMER) {
            throw new SecurityException("当前用户无客户操作权限");
        }
        return principal;
    }

    private AuthPrincipal authenticate(ClientType clientType, GrantType grantType, String identifier, String credential) {
        AuthPrincipal persisted = dbAuthPrincipalProvider == null ? null : dbAuthPrincipalProvider.authenticate(clientType, grantType, identifier, credential);
        if (persisted != null) return persisted;
        if (clientType == ClientType.MINI_PROGRAM && grantType == GrantType.SMS_CODE) {
            String expected = verificationCodes.getOrDefault(identifier, MOCK_CODE);
            if (!expected.equals(credential)) throw new IllegalArgumentException("验证码不正确");
            return new AuthPrincipal(1001L, UserType.CUSTOMER, "customer-demo", null,
                    Set.of("CUSTOMER"), Set.of("booking:read", "booking:create", "booking:cancel", "booking:update", "booking:checkin"),
                    DataScopeType.SELF, Set.of(), Set.of(), customerScopes(), Set.of(), "林知夏", identifier);
        }
        if (clientType == ClientType.ADMIN_WEB && grantType == GrantType.PASSWORD) {
            if (!mockAdminPassword.equals(credential)) {
                throw new IllegalArgumentException("用户名或密码不正确");
            }
            if ("manager".equals(identifier)) {
                return new AuthPrincipal(9002L, UserType.STAFF, null, null,
                        Set.of("STORE_MANAGER"), Set.of("dashboard:read", "booking:read", "booking:update", "booking:cancel", "booking:checkin", "schedule:read", "customer:read", "customer:reveal_phone"),
                        DataScopeType.PRIMARY_STORE, Set.of("store-jingan"), Set.of(), storeScopes(Set.of("store-jingan")), Set.of(), "静安寺店店长", null);
            }
            if ("employee".equals(identifier)) {
                return new AuthPrincipal(9003L, UserType.STAFF, null, "therapist-anran",
                        Set.of("EMPLOYEE"), Set.of("booking:read", "booking:update"),
                        DataScopeType.SELF, Set.of(), Set.of(), employeeScopes(), Set.of(), "沈安然", null);
            }
            if (!"admin".equals(identifier)) throw new IllegalArgumentException("用户名或密码不正确");
            return new AuthPrincipal(9001L, UserType.STAFF, null, null,
                    Set.of("HQ_ADMIN"), Set.of("*"), DataScopeType.ALL_STORES, Set.of(), Set.of(), allStoreScopes(), Set.of(), "系统超级管理员", null);
        }
        throw new IllegalArgumentException("当前客户端不支持该登录方式");
    }

    private static Map<String, Object> response(String token, AuthPrincipal principal) {
        Map<String, Object> scope = scopeView(principal.scopeType(), principal.storeIds(), principal.regionIds());
        Map<String, Object> principalView = new LinkedHashMap<>();
        principalView.put("userId", principal.userId());
        principalView.put("userType", principal.userType().name());
        principalView.put("displayName", principal.displayName());
        principalView.put("mobile", principal.mobile());
        principalView.put("customerId", principal.customerId());
        principalView.put("therapistId", principal.therapistId());
        principalView.put("roles", principal.roles());
        principalView.put("permissions", principal.permissions());
        principalView.put("fieldPermissionCodes", principal.permissions().stream()
                .filter(permission -> permission.contains("reveal_") || permission.startsWith("finance:") || permission.contains("health"))
                .toList());
        principalView.put("deniedPermissionCodes", principal.deniedPermissions());
        principalView.put("storeScopes", principal.dataScopes().stream()
                .map(item -> {
                    Map<String, Object> view = scopeView(item.scopeTypes().iterator().next(), item.storeIds(), item.regionIds());
                    view.put("resourceCode", item.resourceCode());
                    view.put("actionCode", item.actionCode());
                    view.put("scopeTypes", item.scopeTypes().stream().map(Enum::name).toList());
                    return view;
                }).toList());
        principalView.put("dataScope", scope);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("accessToken", token);
        response.put("token", token);
        response.put("tokenType", "Bearer");
        response.put("expiresIn", 7200);
        response.put("principal", principalView);
        response.put("user", Map.of("mobile", principal.mobile() == null ? "" : principal.mobile(), "displayName", principal.displayName()));
        return response;
    }

    private static <T extends Enum<T>> T parse(Class<T> type, String value, String message) {
        try { return Enum.valueOf(type, value.toUpperCase()); }
        catch (IllegalArgumentException exception) { throw new IllegalArgumentException(message); }
    }

    private static Map<String, Object> scopeView(DataScopeType type, Set<String> storeIds, Set<String> regionIds) {
        Map<String, Object> scope = new LinkedHashMap<>();
        scope.put("scopeType", type.name());
        scope.put("storeIds", storeIds);
        scope.put("regionIds", regionIds);
        return scope;
    }

    private static List<DataAccessScope> customerScopes() {
        return List.of(scope("booking", "READ", DataScopeType.SELF, Set.of()),
                scope("booking", "UPDATE", DataScopeType.SELF, Set.of()),
                scope("booking", "CANCEL", DataScopeType.SELF, Set.of()),
                scope("booking", "CHECKIN", DataScopeType.SELF, Set.of()));
    }

    private static List<DataAccessScope> storeScopes(Set<String> stores) {
        return List.of(scope("booking", "READ", DataScopeType.PRIMARY_STORE, stores),
                scope("booking", "UPDATE", DataScopeType.PRIMARY_STORE, stores),
                scope("booking", "CANCEL", DataScopeType.PRIMARY_STORE, stores),
                scope("booking", "CHECKIN", DataScopeType.PRIMARY_STORE, stores),
                scope("schedule", "READ", DataScopeType.PRIMARY_STORE, stores));
    }

    private static List<DataAccessScope> employeeScopes() {
        return List.of(scope("booking", "READ", DataScopeType.SELF, Set.of()),
                scope("booking", "UPDATE", DataScopeType.SELF, Set.of()));
    }

    private static List<DataAccessScope> allStoreScopes() {
        return List.of(scope("booking", "*", DataScopeType.ALL_STORES, Set.of()),
                scope("schedule", "*", DataScopeType.ALL_STORES, Set.of()),
                scope("dashboard", "READ", DataScopeType.ALL_STORES, Set.of()));
    }

    private static DataAccessScope scope(String resource, String action, DataScopeType type, Set<String> stores) {
        return new DataAccessScope(resource, action, Set.of(type), stores, Set.of());
    }
}
