package com.qiyu.application.auth;

import cn.dev33.satoken.stp.SaLoginModel;
import cn.dev33.satoken.stp.StpUtil;
import com.qiyu.domain.auth.ClientType;
import com.qiyu.domain.auth.DataAccessScope;
import com.qiyu.domain.auth.DataScopeType;
import com.qiyu.domain.auth.GrantType;
import com.qiyu.domain.auth.UserType;
import com.qiyu.domain.auth.gateway.SmsVerificationGateway;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.ObjectProvider;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Unified authentication entry point for the admin web application and customer mini program.
 * Database identities are preferred; deterministic identities remain available for mock mode.
 */
@Service
public class AuthAppService {
    private final ConcurrentMap<String, AuthPrincipal> principals = new ConcurrentHashMap<>();
    private final DbAuthPrincipalProvider dbAuthPrincipalProvider;
    private final SmsVerificationGateway smsVerificationGateway;
    @Value("${qiyu.auth.mock-admin-password:}")
    private String mockAdminPassword;

    public AuthAppService(ObjectProvider<DbAuthPrincipalProvider> dbAuthPrincipalProvider,
                          SmsVerificationGateway smsVerificationGateway) {
        this.dbAuthPrincipalProvider = dbAuthPrincipalProvider.getIfAvailable();
        this.smsVerificationGateway = smsVerificationGateway;
    }

    /** Issues a verification code and returns its request metadata. */
    public SendCodeResponse sendCode(String mobile) {
        SmsVerificationGateway.SendResult result = smsVerificationGateway.send(mobile);
        return new SendCodeResponse(mobile, result.requestId(), result.expiresIn(), result.debugCode(), result.mock());
    }

    /** Authenticates one client type and creates the common bearer-token response. */
    public AuthResponse login(String clientTypeValue, String grantTypeValue, String identifier, String credential) {
        ClientType clientType = parse(ClientType.class, clientTypeValue, "客户端类型不正确");
        GrantType grantType = parse(GrantType.class, grantTypeValue, "登录方式不正确");
        AuthPrincipal principal = authenticate(clientType, grantType, identifier, credential);
        // Every client receives the same token contract even though each grant type authenticates differently.
        StpUtil.login(principal.userId(), new SaLoginModel().setTimeout(7200));
        StpUtil.getTokenSession().set("principal", principal);
        String token = StpUtil.getTokenValue();
        principals.put(token, principal);
        return response(token, principal);
    }

    /** Returns the refreshed effective access context for the current token. */
    public AuthResponse current() {
        refreshCurrentAccessContext();
        AuthPrincipal principal = AuthContext.current();
        return response(StpUtil.getTokenValue(), principal);
    }

    /** Invalidates the current token and removes its cached principal. */
    public void logout() {
        String token = StpUtil.getTokenValue();
        principals.remove(token);
        StpUtil.logout();
    }

    /**
     * Rebuilds the effective access snapshot for the current request in persistence mode.
     *
     * <p>This is intentionally request-driven: permission revocation and expiry of temporary
     * cross-store grants must take effect without waiting for the login token to expire.</p>
     */
    public void refreshCurrentAccessContext() {
        if (dbAuthPrincipalProvider == null || !StpUtil.isLogin()) return;
        AuthPrincipal current = AuthContext.current();
        AuthPrincipal refreshed = dbAuthPrincipalProvider.reload(current.userId(), current.mobile());
        if (refreshed != null) {
            StpUtil.getTokenSession().set("principal", refreshed);
            principals.put(StpUtil.getTokenValue(), refreshed);
        }
    }

    /** Requires a staff principal for administration-only workflows. */
    public AuthPrincipal requireAdmin() {
        AuthPrincipal principal = AuthContext.current();
        if (principal.userType() != UserType.STAFF) {
            throw new SecurityException("当前用户无后台访问权限");
        }
        return principal;
    }

    /** Requires staff authentication and one effective function permission. */
    public AuthPrincipal requirePermission(String permission) {
        AuthPrincipal principal = requireAdmin();
        if (!principal.hasPermission(permission)) {
            throw new SecurityException("没有权限执行该操作");
        }
        return principal;
    }

    /** Requires a customer principal for customer-owned workflows. */
    public AuthPrincipal requireCustomer() {
        AuthPrincipal principal = AuthContext.current();
        if (principal.userType() != UserType.CUSTOMER) {
            throw new SecurityException("当前用户无客户操作权限");
        }
        return principal;
    }

    private AuthPrincipal authenticate(ClientType clientType, GrantType grantType, String identifier, String credential) {
        // Once persistence mode is enabled, never fall back to deterministic demo identities.
        // A missing database identity must remain an authentication failure, not become admin access.
        if (dbAuthPrincipalProvider != null) {
            AuthPrincipal persisted = dbAuthPrincipalProvider.authenticate(clientType, grantType, identifier, credential);
            if (persisted == null) throw new IllegalArgumentException("用户名或密码不正确");
            return persisted;
        }
        // Mock identities are available only when the application explicitly runs in mock mode.
        if (clientType == ClientType.MINI_PROGRAM && grantType == GrantType.SMS_CODE) {
            if (!smsVerificationGateway.verify(identifier, credential)) throw new IllegalArgumentException("验证码不正确");
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

    private static AuthResponse response(String token, AuthPrincipal principal) {
        AuthResponse.ScopeView scope = scopeView(principal.scopeType(), principal.storeIds(), principal.regionIds());
        List<AuthResponse.StoreScopeView> scopes = principal.dataScopes().stream()
                .map(item -> new AuthResponse.StoreScopeView(item.resourceCode(), item.actionCode(),
                        item.scopeTypes().stream().map(Enum::name).collect(java.util.stream.Collectors.toSet()),
                        item.storeIds(), item.regionIds())).toList();
        AuthResponse.PrincipalView principalView = new AuthResponse.PrincipalView(
                principal.userId(), principal.userType().name(), principal.displayName(), principal.mobile(),
                principal.customerId(), principal.therapistId(), principal.roles(), principal.permissions(),
                principal.permissions().stream()
                .filter(permission -> permission.contains("reveal_") || permission.startsWith("finance:") || permission.contains("health"))
                .toList(), principal.deniedPermissions(), scopes, scope);
        return new AuthResponse(token, token, "Bearer", 7200, principalView,
                new AuthResponse.UserSummary(principal.mobile() == null ? "" : principal.mobile(), principal.displayName()));
    }

    private static <T extends Enum<T>> T parse(Class<T> type, String value, String message) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        try { return Enum.valueOf(type, value.toUpperCase()); }
        catch (IllegalArgumentException exception) { throw new IllegalArgumentException(message); }
    }

    private static AuthResponse.ScopeView scopeView(DataScopeType type, Set<String> storeIds, Set<String> regionIds) {
        return new AuthResponse.ScopeView(type.name(), storeIds, regionIds);
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
