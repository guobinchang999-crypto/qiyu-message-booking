package com.qiyu.infrastructure.system;

import com.qiyu.application.system.SystemModels;
import com.qiyu.infrastructure.persistence.entity.SystemAuditEntity;
import com.qiyu.infrastructure.persistence.entity.SystemDictionaryEntity;
import com.qiyu.infrastructure.persistence.entity.SystemMenuEntity;
import com.qiyu.infrastructure.persistence.entity.SystemOrganizationEntity;
import com.qiyu.infrastructure.persistence.entity.SystemRoleEntity;
import com.qiyu.infrastructure.persistence.entity.SystemUserEntity;
import com.qiyu.infrastructure.persistence.mapper.SystemAuditLogProjection;
import com.qiyu.infrastructure.persistence.mapper.SystemDictionaryProjection;
import com.qiyu.infrastructure.persistence.mapper.SystemManagementMapper;
import com.qiyu.infrastructure.persistence.mapper.SystemMenuProjection;
import com.qiyu.infrastructure.persistence.mapper.SystemOrganizationProjection;
import com.qiyu.infrastructure.persistence.mapper.SystemRoleProjection;
import com.qiyu.infrastructure.persistence.mapper.SystemUserProjection;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

/**
 * Coordinates system-management persistence through parameterized MyBatis-Plus mappers.
 *
 * <p>The public contract deliberately remains application-model based. Persistence rows and SQL projections are
 * converted here so database details never leak into controllers or application services.</p>
 */
@Repository
public class SystemManagementRepository {
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private static final List<String> SCOPED_RESOURCES = List.of(
            "store", "booking", "service_order", "schedule", "therapist", "room",
            "customer", "member", "coupon", "report");
    private static final Set<String> SCOPE_TYPES = Set.of(
            "NONE", "SELF", "PRIMARY_STORE", "ASSIGNED_STORES", "REGION_STORES", "ALL_STORES");
    private final SystemManagementMapper mapper;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public SystemManagementRepository(SystemManagementMapper mapper) {
        this.mapper = mapper;
    }

    /** Queries organizations and maps persistence projections to the stable application response model. */
    public SystemModels.Page<SystemModels.Organization> organizations(String keyword, int page, int pageSize) {
        String normalized = normalize(keyword);
        List<SystemModels.Organization> records = mapper.organizations(normalized, pattern(normalized), pageSize, offset(page, pageSize))
                .stream().map(this::toOrganization).toList();
        return new SystemModels.Page<>(records, mapper.countOrganizations(normalized, pattern(normalized)));
    }

    @Transactional
    public SystemModels.Organization saveOrganization(Long id, SystemModels.OrganizationCommand command, long operatorId) {
        boolean creating = id == null;
        SystemOrganizationEntity entity = new SystemOrganizationEntity();
        entity.setParentId(numericId(command.parentId()));
        entity.setName(command.name());
        entity.setLeaderUserId(findUserId(command.leader()));
        entity.setSortOrder(value(command.sort(), 0));
        entity.setStatus(command.status());
        if (creating) {
            entity.setCode(command.type().toUpperCase(Locale.ROOT) + "_" + randomCode());
            mapper.insertOrganization(entity);
            id = entity.getId();
        } else {
            ensureOrganization(id);
            entity.setId(id);
            mapper.updateOrganization(entity);
        }
        audit(operatorId, creating ? "system:org:create" : "system:org:update", "ORGANIZATION", id);
        return organization(id);
    }

    @Transactional
    public void deleteOrganization(long id, long operatorId) {
        ensureOrganization(id);
        if (mapper.childOrganizationCount(id) > 0 || mapper.organizationUserCount(id) > 0) {
            throw new IllegalArgumentException("组织下存在子组织或用户，不能删除");
        }
        mapper.deleteOrganization(id);
        audit(operatorId, "system:org:delete", "ORGANIZATION", id);
    }

    /** Queries staff accounts with their aggregated role, department and data-scope information. */
    public SystemModels.Page<SystemModels.User> users(String keyword, int page, int pageSize) {
        String normalized = normalize(keyword);
        List<SystemModels.User> records = mapper.users(normalized, pattern(normalized), pageSize, offset(page, pageSize))
                .stream().map(this::toUser).toList();
        return new SystemModels.Page<>(records, mapper.countUsers(normalized, pattern(normalized)));
    }

    /**
     * Saves the account and all authorization relations atomically.
     *
     * <p>A system user spans four ownership records (user, login identity, staff profile and authorization
     * assignments). Replacing department, role and scope links in the same transaction prevents a login from
     * observing a half-updated permission context.</p>
     */
    @Transactional
    public SystemModels.User saveUser(Long id, SystemModels.UserCommand command, long operatorId) {
        String operator = String.valueOf(operatorId);
        boolean creating = id == null;
        if (creating) {
            SystemUserEntity user = new SystemUserEntity();
            user.setDisplayName(command.displayName());
            user.setStatus(command.status());
            user.setCreatedBy(operator);
            mapper.insertSystemUser(user);
            id = user.getId();
            mapper.insertIdentity(id, command.username(), command.status(), operator);
            mapper.insertStaff(id, "EMP" + id, command.phone(), command.status(), operator);
        } else {
            ensureUser(id);
            mapper.updateSystemUser(id, command.displayName(), command.status(), operator);
            if (mapper.updateIdentity(id, command.username(), command.status(), operator) == 0) {
                mapper.insertIdentity(id, command.username(), command.status(), operator);
            }
            if (mapper.updateStaff(id, command.phone(), command.status(), operator) == 0) {
                mapper.insertStaff(id, "EMP" + id, command.phone(), command.status(), operator);
            }
        }
        replaceUserDepartment(id, command.departmentName());
        replaceUserRoles(id, command.roleNames());
        // General profile edits must not silently erase detailed temporary store or region grants.
        if (creating) {
            replaceUserScopes(id, command.dataScope(), null, null, operatorId);
        }
        audit(operatorId, "system:user:save", "SYSTEM_USER", id);
        return user(id);
    }

    @Transactional
    public void deleteUser(long id, long operatorId) {
        ensureUser(id);
        String operator = String.valueOf(operatorId);
        mapper.softDeleteUser(id, operator);
        mapper.softDeleteIdentities(id, operator);
        mapper.softDeleteStaff(id, operator);
        mapper.deleteUserRoles(id);
        mapper.deleteUserDepartments(id);
        mapper.deleteUserScopes(id);
        mapper.deleteUserScopeStores(id);
        mapper.deleteUserScopeRegions(id);
        audit(operatorId, "system:user:delete", "SYSTEM_USER", id);
    }

    /** Returns the explicit user override, or the role-derived summary when no override exists yet. */
    public SystemModels.UserDataScope userDataScope(long userId) {
        ensureUser(userId);
        var row = mapper.userDataScope(userId);
        String roleScope = scopeType(user(userId).dataScope());
        String scopeType = row == null ? (roleScope == null ? "SELF" : roleScope) : row.scopeType();
        return new SystemModels.UserDataScope(String.valueOf(userId), scopeType,
                mapper.userScopeStoreIds(userId), mapper.userScopeRegionIds(userId),
                row == null ? null : row.validFrom(), row == null ? null : row.validUntil(), row == null);
    }

    /** Replaces scope rows and their store/region children in one transaction. */
    @Transactional
    public SystemModels.UserDataScope saveUserDataScope(
            long userId,
            SystemModels.UserDataScopeCommand command,
            long operatorId
    ) {
        ensureUser(userId);
        String scope = normalizedScopeType(command.scopeType());
        LocalDateTime validFrom = command.validFrom();
        LocalDateTime validUntil = command.validUntil();
        if (validFrom != null && validUntil != null && !validFrom.isBefore(validUntil)) {
            throw new IllegalArgumentException("授权失效时间必须晚于生效时间");
        }
        List<String> storeIds = safe(command.storeIds());
        List<String> regionIds = safe(command.regionIds());
        if ("ASSIGNED_STORES".equals(scope) && storeIds.isEmpty()) {
            throw new IllegalArgumentException("指定门店范围至少需要选择一个门店");
        }
        if ("REGION_STORES".equals(scope) && regionIds.isEmpty()) {
            throw new IllegalArgumentException("区域范围至少需要选择一个区域");
        }

        mapper.deleteUserScopeStores(userId);
        mapper.deleteUserScopeRegions(userId);
        replaceUserScopes(userId, scope, validFrom, validUntil, operatorId);
        if ("ASSIGNED_STORES".equals(scope)) {
            for (String resource : SCOPED_RESOURCES) {
                for (String storeId : storeIds) {
                    if (mapper.insertUserScopeStore(userId, resource, storeId, validFrom, validUntil, operatorId) == 0) {
                        throw new IllegalArgumentException("授权门店不存在：" + storeId);
                    }
                }
            }
        }
        if ("REGION_STORES".equals(scope)) {
            for (String resource : SCOPED_RESOURCES) {
                for (String regionId : regionIds) {
                    if (mapper.insertUserScopeRegion(userId, resource, regionId, validFrom, validUntil, operatorId) == 0) {
                        throw new IllegalArgumentException("授权区域不存在：" + regionId);
                    }
                }
            }
        }
        audit(operatorId, "system:user:data-scope", "SYSTEM_USER", userId);
        return userDataScope(userId);
    }

    /** Deletes the complete override graph, causing authorization to use role assignments again. */
    @Transactional
    public SystemModels.UserDataScope clearUserDataScope(long userId, long operatorId) {
        ensureUser(userId);
        mapper.deleteUserScopeStores(userId);
        mapper.deleteUserScopeRegions(userId);
        mapper.deleteUserScopes(userId);
        audit(operatorId, "system:user:data-scope:clear", "SYSTEM_USER", userId);
        return userDataScope(userId);
    }

    /** Returns stable choices for the administration scope editor. */
    public SystemModels.DataScopeOptions dataScopeOptions() {
        List<SystemModels.ScopeOption> stores = mapper.dataScopeStoreOptions().stream()
                .map(row -> new SystemModels.ScopeOption(row.id(), row.name())).toList();
        List<SystemModels.ScopeOption> regions = mapper.dataScopeRegionOptions().stream()
                .map(row -> new SystemModels.ScopeOption(row.id(), row.name())).toList();
        return new SystemModels.DataScopeOptions(stores, regions);
    }

    /** Replaces the persisted password hash and records the privileged operation. */
    @Transactional
    public void resetUserPassword(long id, String newPassword, long operatorId) {
        ensureUser(id);
        if (mapper.updatePasswordHash(id, passwordEncoder.encode(newPassword), String.valueOf(operatorId)) == 0) {
            throw new IllegalArgumentException("用户没有可重置的密码身份");
        }
        audit(operatorId, "system:user:reset_password", "SYSTEM_USER", id);
    }

    /** Queries roles while preserving the existing permission and data-scope response shape. */
    public SystemModels.Page<SystemModels.Role> roles(String keyword, int page, int pageSize) {
        String normalized = normalize(keyword);
        List<SystemModels.Role> records = mapper.roles(normalized, pattern(normalized), pageSize, offset(page, pageSize))
                .stream().map(this::toRole).toList();
        return new SystemModels.Page<>(records, mapper.countRoles(normalized, pattern(normalized)));
    }

    /** Replaces permissions and data scopes only after every referenced permission code has been validated. */
    @Transactional
    public SystemModels.Role saveRole(Long id, SystemModels.RoleCommand command, long operatorId) {
        List<String> allowedCodes = safe(command.permissionCodes());
        List<String> deniedCodes = safe(command.deniedPermissionCodes());
        Set<String> overlap = new java.util.LinkedHashSet<>(allowedCodes);
        overlap.retainAll(deniedCodes);
        if (!overlap.isEmpty()) {
            throw new IllegalArgumentException("权限不能同时允许和禁止：" + String.join(",", overlap));
        }
        List<Long> permissionIds = permissionIds(allowedCodes);
        List<Long> deniedPermissionIds = permissionIds(deniedCodes);
        String operator = String.valueOf(operatorId);
        if (id == null) {
            SystemRoleEntity role = new SystemRoleEntity();
            role.setCode(command.code());
            role.setName(command.name());
            role.setStatus(command.status());
            role.setCreatedBy(operator);
            mapper.insertRole(role);
            id = role.getId();
        } else {
            ensureRole(id);
            mapper.updateRole(id, command.code(), command.name(), command.status(), operator);
        }
        mapper.deleteRolePermissions(id);
        for (Long permissionId : permissionIds) mapper.insertRolePermission(id, permissionId, "ALLOW");
        for (Long permissionId : deniedPermissionIds) mapper.insertRolePermission(id, permissionId, "DENY");
        mapper.deleteRoleScopes(id);
        String scope = normalizedScopeType(command.dataScope());
        for (String resource : SCOPED_RESOURCES) mapper.insertRoleScope(id, resource, scope);
        audit(operatorId, "system:role:save", "ROLE", id);
        return role(id);
    }

    @Transactional
    public void deleteRole(long id, long operatorId) {
        ensureRole(id);
        if (mapper.roleUserCount(id) > 0) throw new IllegalArgumentException("角色仍有用户，不能删除");
        mapper.softDeleteRole(id, String.valueOf(operatorId));
        mapper.deleteRolePermissions(id);
        mapper.deleteRoleMenus(id);
        mapper.deleteRoleScopes(id);
        audit(operatorId, "system:role:delete", "ROLE", id);
    }

    /** Queries system menus in persisted display order and derives the public visibility flag. */
    public SystemModels.Page<SystemModels.Menu> menus(String keyword, int page, int pageSize) {
        String normalized = normalize(keyword);
        List<SystemModels.Menu> records = mapper.menus(normalized, pattern(normalized), pageSize, offset(page, pageSize))
                .stream().map(this::toMenu).toList();
        return new SystemModels.Page<>(records, mapper.countMenus(normalized, pattern(normalized)));
    }

    @Transactional
    public SystemModels.Menu saveMenu(Long id, SystemModels.MenuCommand command, long operatorId) {
        String status = Boolean.FALSE.equals(command.visible()) ? "DISABLED" : command.status();
        long parentId = numericId(command.parentId());
        if (id == null) {
            SystemMenuEntity menu = new SystemMenuEntity();
            menu.setParentId(parentId);
            menu.setCode("MENU_" + randomCode());
            menu.setName(command.name());
            menu.setType(command.type());
            menu.setPath(blankToNull(command.path()));
            menu.setPermissionCode(blankToNull(command.permissionCode()));
            menu.setSortOrder(value(command.sort(), 0));
            menu.setStatus(status);
            menu.setCreatedBy(String.valueOf(operatorId));
            mapper.insertMenu(menu);
            id = menu.getId();
        } else {
            ensureMenu(id);
            mapper.updateMenu(id, parentId, command.name(), command.type(), blankToNull(command.path()),
                    blankToNull(command.permissionCode()), value(command.sort(), 0), status, String.valueOf(operatorId));
        }
        audit(operatorId, "system:menu:save", "MENU", id);
        return menu(id);
    }

    @Transactional
    public void deleteMenu(long id, long operatorId) {
        ensureMenu(id);
        if (mapper.childMenuCount(id) > 0) throw new IllegalArgumentException("菜单下存在子菜单，不能删除");
        mapper.softDeleteMenu(id, String.valueOf(operatorId));
        mapper.deleteMenuRoles(id);
        audit(operatorId, "system:menu:delete", "MENU", id);
    }

    /** Queries dictionary items together with their owning dictionary-type metadata. */
    public SystemModels.Page<SystemModels.Dictionary> dictionaries(String keyword, int page, int pageSize) {
        String normalized = normalize(keyword);
        List<SystemModels.Dictionary> records = mapper.dictionaries(normalized, pattern(normalized), pageSize, offset(page, pageSize))
                .stream().map(this::toDictionary).toList();
        return new SystemModels.Page<>(records, mapper.countDictionaries(normalized, pattern(normalized)));
    }

    /** Dictionary type metadata and the item are committed together because the UI edits them as one aggregate. */
    @Transactional
    public SystemModels.Dictionary saveDictionary(Long id, SystemModels.DictionaryCommand command, long operatorId) {
        int enabled = "ENABLED".equals(command.status()) ? 1 : 0;
        String operator = String.valueOf(operatorId);
        String remark = blankToNull(command.remark());
        if (mapper.updateDictionaryType(command.typeCode(), command.typeName(), remark, operator) == 0) {
            mapper.insertDictionaryType(command.typeCode(), command.typeName(), remark, enabled, operator);
        }
        if (id == null) {
            SystemDictionaryEntity item = new SystemDictionaryEntity();
            item.setTypeCode(command.typeCode());
            item.setItemCode("ITEM_" + randomCode());
            item.setItemLabel(command.itemLabel());
            item.setItemValue(command.itemValue());
            item.setEnabled(enabled);
            item.setSortOrder(value(command.sort(), 0));
            item.setCreatedBy(operator);
            mapper.insertDictionary(item);
            id = item.getId();
        } else {
            ensureDictionary(id);
            mapper.updateDictionary(id, command.typeCode(), command.itemLabel(), command.itemValue(), enabled,
                    value(command.sort(), 0), operator);
        }
        audit(operatorId, "system:dict:save", "DICTIONARY", id);
        return dictionary(id);
    }

    @Transactional
    public void deleteDictionary(long id, long operatorId) {
        ensureDictionary(id);
        mapper.softDeleteDictionary(id, String.valueOf(operatorId));
        audit(operatorId, "system:dict:delete", "DICTIONARY", id);
    }

    /** Queries enriched audit entries and keeps the existing successful-operation status contract. */
    public SystemModels.Page<SystemModels.AuditLog> auditLogs(String keyword, int page, int pageSize) {
        String normalized = normalize(keyword);
        List<SystemModels.AuditLog> records = mapper.auditLogs(normalized, pattern(normalized), pageSize, offset(page, pageSize))
                .stream().map(this::toAuditLog).toList();
        return new SystemModels.Page<>(records, mapper.countAuditLogs(normalized, pattern(normalized)));
    }

    private SystemModels.Organization organization(long id) { return findById(organizations("", 1, 10_000).records(), id); }
    private SystemModels.User user(long id) { return findById(users("", 1, 10_000).records(), id); }
    private SystemModels.Role role(long id) { return findById(roles("", 1, 10_000).records(), id); }
    private SystemModels.Menu menu(long id) { return findById(menus("", 1, 10_000).records(), id); }
    private SystemModels.Dictionary dictionary(long id) { return findById(dictionaries("", 1, 10_000).records(), id); }

    private <T> T findById(List<T> values, long id) {
        String expected = String.valueOf(id);
        return values.stream().filter(value -> {
            try { return expected.equals(String.valueOf(value.getClass().getMethod("id").invoke(value))); }
            catch (ReflectiveOperationException exception) { return false; }
        }).findFirst().orElseThrow(() -> new IllegalArgumentException("数据不存在"));
    }

    private void replaceUserDepartment(long userId, String departmentName) {
        Long departmentId = mapper.departmentId(departmentName);
        if (departmentId == null) throw new IllegalArgumentException("所属组织/部门不存在：" + departmentName);
        mapper.deleteUserDepartments(userId);
        mapper.insertUserDepartment(userId, departmentId);
    }

    private void replaceUserRoles(long userId, List<String> roleNames) {
        List<Long> roleIds = safe(roleNames).stream().map(name -> {
            Long roleId = mapper.roleIdByName(name);
            if (roleId == null) throw new IllegalArgumentException("角色不存在：" + name);
            return roleId;
        }).toList();
        mapper.deleteUserRoles(userId);
        for (Long roleId : roleIds) mapper.insertUserRole(userId, roleId);
    }

    private void replaceUserScopes(long userId, String dataScope, LocalDateTime validFrom,
                                   LocalDateTime validUntil, long operatorId) {
        mapper.deleteUserScopes(userId);
        String scope = normalizedScopeType(dataScope);
        for (String resource : SCOPED_RESOURCES) {
            mapper.insertUserScope(userId, resource, scope, validFrom, validUntil, operatorId);
        }
    }

    private Long findUserId(String displayName) {
        return displayName == null || displayName.isBlank() ? null : mapper.findUserIdByDisplayName(displayName);
    }

    private void ensureOrganization(long id) { if (mapper.organizationExists(id) == 0) missing(); }
    private void ensureUser(long id) { if (mapper.userExists(id) == 0) missing(); }
    private void ensureRole(long id) { if (mapper.roleExists(id) == 0) missing(); }
    private void ensureMenu(long id) { if (mapper.menuExists(id) == 0) missing(); }
    private void ensureDictionary(long id) { if (mapper.dictionaryExists(id) == 0) missing(); }
    private static void missing() { throw new IllegalArgumentException("数据不存在"); }

    private void audit(long operatorId, String action, String resourceType, long resourceId) {
        mapper.insertAudit(new SystemAuditEntity(operatorId, action, resourceType, String.valueOf(resourceId)));
    }

    /** Maps an organization persistence projection without exposing database naming to the application contract. */
    private SystemModels.Organization toOrganization(SystemOrganizationProjection row) {
        return new SystemModels.Organization(id(row.id()), nullableId(row.parentId()), string(row.deptName()),
                organizationType(string(row.deptCode())), string(row.leader()), row.sortOrder(), string(row.status()));
    }

    /** Expands comma-separated persistence aggregates into the existing user response contract. */
    private SystemModels.User toUser(SystemUserProjection row) {
        return new SystemModels.User(id(row.id()), string(row.username()), string(row.displayName()), string(row.phone()),
                string(row.departmentName()), split(row.roleNames()), scopeLabel(row.dataScopes()),
                string(row.status()), time(row.lastLoginAt()));
    }

    /** Expands role permission aggregates while preserving the current API representation. */
    private SystemModels.Role toRole(SystemRoleProjection row) {
        return new SystemModels.Role(id(row.id()), string(row.roleCode()), string(row.roleName()),
                split(row.permissionCodes()), split(row.deniedPermissionCodes()), scopeLabel(row.dataScopes()),
                row.userCount(), string(row.status()));
    }

    /** Resolves all permission codes before any role relation is replaced. */
    private List<Long> permissionIds(List<String> codes) {
        return codes.stream().map(code -> {
            Long permissionId = mapper.permissionId(code);
            if (permissionId == null) throw new IllegalArgumentException("权限码不存在：" + code);
            return permissionId;
        }).toList();
    }

    /** Derives menu visibility from status exactly as the existing API contract requires. */
    private SystemModels.Menu toMenu(SystemMenuProjection row) {
        String status = string(row.status());
        return new SystemModels.Menu(id(row.id()), nullableId(row.parentId()), string(row.menuName()),
                string(row.routePath()), string(row.permissionCode()), string(row.menuType()), row.sortOrder(),
                "ENABLED".equals(status), status);
    }

    /** Converts the persisted enabled flag into the public dictionary status label. */
    private SystemModels.Dictionary toDictionary(SystemDictionaryProjection row) {
        return new SystemModels.Dictionary(id(row.id()), string(row.typeCode()), string(row.typeName()),
                string(row.itemLabel()), string(row.itemValue()), row.sortOrder(),
                row.enabled() != 0 ? "ENABLED" : "DISABLED", string(row.description()));
    }

    /** Maps the audit projection and retains the historical successful-operation status exposed by the API. */
    private SystemModels.AuditLog toAuditLog(SystemAuditLogProjection row) {
        return new SystemModels.AuditLog(id(row.id()), string(row.operatorName()), string(row.actionCode()),
                string(row.resourceType()), string(row.resourceId()), string(row.organizationName()),
                "SUCCESS", string(row.requestId()), string(row.detail()), time(row.createdAt()));
    }

    private static String id(long value) { return String.valueOf(value); }
    private static String nullableId(Long value) {
        return value == null || value == 0 ? null : String.valueOf(value);
    }
    private static String string(String value) { return value == null ? "" : value; }
    private static String time(LocalDateTime value) { return value == null ? null : DATE_TIME.format(value); }
    private static int offset(int page, int pageSize) { return (Math.max(page, 1) - 1) * pageSize; }
    private static int value(Integer value, int fallback) { return value == null ? fallback : value; }
    private static String normalize(String keyword) { return keyword == null ? "" : keyword.trim(); }
    private static String pattern(String keyword) { return "%" + keyword + "%"; }
    private static String blankToNull(String value) { return value == null || value.isBlank() ? null : value.trim(); }
    private static String randomCode() { return UUID.randomUUID().toString().replace("-", "").substring(0, 12).toUpperCase(Locale.ROOT); }
    private static long numericId(String id) {
        if (id == null || id.isBlank()) return 0;
        try { return Long.parseLong(id); }
        catch (NumberFormatException exception) { throw new IllegalArgumentException("ID 格式不正确"); }
    }
    private static List<String> split(String value) { return value == null || value.isBlank() ? List.of() : Arrays.stream(value.split(",")).distinct().toList(); }
    private static List<String> safe(List<String> values) { return values == null ? List.of() : values.stream().filter(value -> value != null && !value.isBlank()).distinct().toList(); }
    private static String organizationType(String code) {
        if ("HQ".equals(code)) return "HEADQUARTERS";
        if (code.startsWith("REGION") || code.contains("REGION")) return "REGION";
        if (code.startsWith("STORE")) return "STORE";
        return "DEPARTMENT";
    }
    private static String scopeLabel(String values) {
        if (values == null) return "本人";
        if (values.contains("NONE")) return "禁止访问";
        if (values.contains("ALL_STORES")) return "全部门店";
        if (values.contains("REGION_STORES")) return "本区域及下级";
        if (values.contains("ASSIGNED_STORES")) return "指定门店";
        if (values.contains("PRIMARY_STORE") || values.contains("STORE")) return "本门店";
        return "本人";
    }
    /** Maps a Chinese display label to its canonical English scope type, or null when unknown. */
    private static String scopeType(String label) {
        return switch (label) {
            case "全部门店" -> "ALL_STORES";
            case "本区域及下级" -> "REGION_STORES";
            case "指定门店" -> "ASSIGNED_STORES";
            case "本门店" -> "PRIMARY_STORE";
            case "本人" -> "SELF";
            case "禁止访问" -> "NONE";
            default -> null;
        };
    }

    /**
     * Normalizes an incoming scope type and rejects anything outside the stable contract.
     *
     * <p>Only the six English enums and their explicit Chinese labels are accepted. Unknown,
     * blank or null values raise an {@link IllegalArgumentException} instead of silently
     * degrading to {@code SELF}, so the API returns 400 rather than granting the narrowest
     * scope by accident.</p>
     */
    private static String normalizedScopeType(String value) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException("数据范围类型不正确");
        }
        String trimmed = value.trim();
        String upper = trimmed.toUpperCase(Locale.ROOT);
        String scope = SCOPE_TYPES.contains(upper) ? upper : scopeType(trimmed);
        if (scope == null || !SCOPE_TYPES.contains(scope)) {
            throw new IllegalArgumentException("数据范围类型不正确");
        }
        return scope;
    }
}
