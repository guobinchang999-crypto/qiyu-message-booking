package com.qiyu.infrastructure.system;

import com.qiyu.application.system.SystemModels;
import com.qiyu.infrastructure.persistence.entity.SystemAuditEntity;
import com.qiyu.infrastructure.persistence.entity.SystemDictionaryEntity;
import com.qiyu.infrastructure.persistence.entity.SystemMenuEntity;
import com.qiyu.infrastructure.persistence.entity.SystemOrganizationEntity;
import com.qiyu.infrastructure.persistence.entity.SystemRoleEntity;
import com.qiyu.infrastructure.persistence.entity.SystemUserEntity;
import com.qiyu.infrastructure.persistence.mapper.SystemManagementMapper;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Map;
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
    private final SystemManagementMapper mapper;

    public SystemManagementRepository(SystemManagementMapper mapper) {
        this.mapper = mapper;
    }

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
        if (id == null) {
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
        replaceUserScopes(id, command.dataScope(), operatorId);
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
        audit(operatorId, "system:user:delete", "SYSTEM_USER", id);
    }

    public SystemModels.Page<SystemModels.Role> roles(String keyword, int page, int pageSize) {
        String normalized = normalize(keyword);
        List<SystemModels.Role> records = mapper.roles(normalized, pattern(normalized), pageSize, offset(page, pageSize))
                .stream().map(this::toRole).toList();
        return new SystemModels.Page<>(records, mapper.countRoles(normalized, pattern(normalized)));
    }

    /** Replaces permissions and data scopes only after every referenced permission code has been validated. */
    @Transactional
    public SystemModels.Role saveRole(Long id, SystemModels.RoleCommand command, long operatorId) {
        List<Long> permissionIds = safe(command.permissionCodes()).stream().map(code -> {
            Long permissionId = mapper.permissionId(code);
            if (permissionId == null) throw new IllegalArgumentException("权限码不存在：" + code);
            return permissionId;
        }).toList();
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
        for (Long permissionId : permissionIds) mapper.insertRolePermission(id, permissionId);
        mapper.deleteRoleScopes(id);
        String scope = scopeType(command.dataScope());
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

    private void replaceUserScopes(long userId, String dataScope, long operatorId) {
        mapper.deleteUserScopes(userId);
        String scope = scopeType(dataScope);
        for (String resource : SCOPED_RESOURCES) mapper.insertUserScope(userId, resource, scope, operatorId);
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

    private SystemModels.Organization toOrganization(Map<String, Object> row) {
        String code = string(row, "deptCode");
        return new SystemModels.Organization(id(row), nullableId(row, "parentId"), string(row, "deptName"),
                organizationType(code), string(row, "leader"), integer(row, "sortOrder"), string(row, "status"));
    }

    private SystemModels.User toUser(Map<String, Object> row) {
        return new SystemModels.User(id(row), string(row, "username"), string(row, "displayName"), string(row, "phone"),
                string(row, "departmentName"), split(string(row, "roleNames")), scopeLabel(string(row, "dataScopes")),
                string(row, "status"), time(object(row, "lastLoginAt")));
    }

    private SystemModels.Role toRole(Map<String, Object> row) {
        return new SystemModels.Role(id(row), string(row, "roleCode"), string(row, "roleName"),
                split(string(row, "permissionCodes")), scopeLabel(string(row, "dataScopes")),
                number(row, "userCount").longValue(), string(row, "status"));
    }

    private SystemModels.Menu toMenu(Map<String, Object> row) {
        String status = string(row, "status");
        return new SystemModels.Menu(id(row), nullableId(row, "parentId"), string(row, "menuName"),
                string(row, "routePath"), string(row, "permissionCode"), string(row, "menuType"),
                integer(row, "sortOrder"), "ENABLED".equals(status), status);
    }

    private SystemModels.Dictionary toDictionary(Map<String, Object> row) {
        boolean enabled = number(row, "enabled").intValue() != 0;
        return new SystemModels.Dictionary(id(row), string(row, "typeCode"), string(row, "typeName"),
                string(row, "itemLabel"), string(row, "itemValue"), integer(row, "sortOrder"),
                enabled ? "ENABLED" : "DISABLED", string(row, "description"));
    }

    private SystemModels.AuditLog toAuditLog(Map<String, Object> row) {
        return new SystemModels.AuditLog(id(row), string(row, "operatorName"), string(row, "actionCode"),
                string(row, "resourceType"), string(row, "resourceId"), string(row, "organizationName"),
                "SUCCESS", string(row, "requestId"), string(row, "detail"), time(object(row, "createdAt")));
    }

    private static Object object(Map<String, Object> row, String key) {
        if (row.containsKey(key)) return row.get(key);
        String normalized = key.replace("_", "").toLowerCase(Locale.ROOT);
        return row.entrySet().stream()
                .filter(entry -> entry.getKey().replace("_", "").equalsIgnoreCase(normalized))
                .map(Map.Entry::getValue).findFirst().orElse(null);
    }

    private static String id(Map<String, Object> row) { return String.valueOf(number(row, "id").longValue()); }
    private static String nullableId(Map<String, Object> row, String key) {
        Object value = object(row, key);
        if (value == null || ((Number) value).longValue() == 0) return null;
        return String.valueOf(((Number) value).longValue());
    }
    private static Number number(Map<String, Object> row, String key) {
        Object value = object(row, key);
        return value instanceof Number number ? number : 0;
    }
    private static int integer(Map<String, Object> row, String key) { return number(row, key).intValue(); }
    private static String string(Map<String, Object> row, String key) {
        Object value = object(row, key);
        return value == null ? "" : String.valueOf(value);
    }
    private static String time(Object value) {
        if (value instanceof Timestamp timestamp) return DATE_TIME.format(timestamp.toLocalDateTime());
        if (value instanceof LocalDateTime dateTime) return DATE_TIME.format(dateTime);
        return value == null ? null : String.valueOf(value);
    }
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
        if (values.contains("ALL_STORES")) return "全部门店";
        if (values.contains("REGION_STORES")) return "本区域及下级";
        if (values.contains("ASSIGNED_STORES")) return "指定门店";
        if (values.contains("PRIMARY_STORE") || values.contains("STORE")) return "本门店";
        return "本人";
    }
    private static String scopeType(String label) {
        return switch (label) {
            case "全部门店" -> "ALL_STORES";
            case "本区域及下级" -> "REGION_STORES";
            case "指定门店" -> "ASSIGNED_STORES";
            case "本门店" -> "PRIMARY_STORE";
            default -> "SELF";
        };
    }
}
