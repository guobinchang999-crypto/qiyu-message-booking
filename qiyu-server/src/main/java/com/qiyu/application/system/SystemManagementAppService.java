package com.qiyu.application.system;

import com.qiyu.application.system.dto.SystemModels;

import com.qiyu.application.auth.AuthPrincipal;
import com.qiyu.application.auth.DataPermissionService;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.function.Supplier;

/**
 * Orchestrates system administration use cases and defines their authorization boundary.
 * Persistence-specific relationship synchronization remains delegated to the gateway.
 */
@Service
public class SystemManagementAppService {
    public List<SystemModels.Menu> navigation() {
        var principal=com.qiyu.application.auth.AuthContext.current();
        return SystemRouteRegistry.navigation(gateway.menus("",1,Integer.MAX_VALUE).records(),principal);
    }
    public List<SystemModels.Menu> menuTree() {
        require("system:menu:manage");return gateway.menus("",1,Integer.MAX_VALUE).records();
    }
    public List<SystemModels.ScopeOption> registeredRoutes() {
        require("system:menu:manage");return SystemRouteRegistry.ROUTES.keySet().stream().sorted()
            .map(path->new SystemModels.ScopeOption(path,path)).toList();
    }
    public long organizationImpact(String id) {
        require("system:org:manage");return gateway.organizationMembers(requiredId(id),true,1,1).total();
    }
    public List<SystemModels.Organization> organizationTree() {
        require("system:org:manage");return gateway.organizationTree();
    }
    public SystemModels.Page<SystemModels.OrganizationMember> organizationMembers(String id,boolean descendants,int page,int pageSize) {
        require("system:org:manage");require("system:user:manage");
        return gateway.organizationMembers(requiredId(id),descendants,page(page),pageSize(pageSize));
    }
    private final DataPermissionService permissions;
    private final SystemManagementGateway gateway;

    public SystemManagementAppService(DataPermissionService permissions, SystemManagementGateway gateway) {
        this.permissions = permissions;
        this.gateway = gateway;
    }

    public SystemModels.Page<SystemModels.Organization> organizations(String keyword, int page, int pageSize) {
        require("system:org:manage");
        return gateway.organizations(text(keyword), page(page), pageSize(pageSize));
    }

    public SystemModels.Organization saveOrganization(String id, SystemModels.OrganizationCommand command) {
        validate(command.name(), "组织名称");
        validate(command.type(), "组织类型");
        return write(() -> gateway.saveOrganization(id(id), command, require("system:org:manage").userId()));
    }

    public void deleteOrganization(String id) {
        gateway.deleteOrganization(requiredId(id), require("system:org:manage").userId());
    }

    public SystemModels.Page<SystemModels.User> users(String keyword, int page, int pageSize) {
        require("system:user:manage");
        return gateway.users(text(keyword), page(page), pageSize(pageSize));
    }

    public SystemModels.User saveUser(String id, SystemModels.UserCommand command) {
        validate(command.username(), "登录账号");
        validate(command.displayName(), "姓名");
        validate(command.departmentName(), "所属组织/部门");
        return write(() -> gateway.saveUser(id(id), command, require("system:user:manage").userId()));
    }

    public void deleteUser(String id) {
        AuthPrincipal principal = require("system:user:manage");
        long userId = requiredId(id);
        // Prevent an administrator from invalidating the identity that authorizes this operation.
        if (principal.userId() == userId) {
            throw new IllegalArgumentException("不能删除当前登录用户");
        }
        gateway.deleteUser(userId, principal.userId());
    }

    /** Resets one staff password without exposing either plaintext or the stored hash. */
    public void resetUserPassword(String id, SystemModels.PasswordResetCommand command) {
        if (command == null || command.newPassword() == null || command.newPassword().length() < 8) {
            throw new IllegalArgumentException("新密码至少需要 8 个字符");
        }
        gateway.resetUserPassword(requiredId(id), command.newPassword(), require("system:user:manage").userId());
    }

    /** Reads one user-level override after verifying system-user administration permission. */
    public SystemModels.UserDataScope userDataScope(String id) {
        require("system:user:manage");
        return gateway.userDataScope(requiredId(id));
    }

    /** Validates and replaces a user-level data-scope override as one transaction. */
    public SystemModels.UserDataScope saveUserDataScope(String id, SystemModels.UserDataScopeCommand command) {
        if (command == null) {
            throw new IllegalArgumentException("数据权限参数不能为空");
        }
        return gateway.saveUserDataScope(requiredId(id), command, require("system:user:manage").userId());
    }

    /** Clears a user override and restores dynamic inheritance from assigned roles. */
    public SystemModels.UserDataScope clearUserDataScope(String id) {
        return gateway.clearUserDataScope(requiredId(id), require("system:user:manage").userId());
    }

    /** Returns authorization selector options without exposing persistence entities. */
    public SystemModels.DataScopeOptions dataScopeOptions() {
        require("system:user:manage");
        return gateway.dataScopeOptions();
    }

    /** Reads one user's direct permission overrides after verifying system-user administration. */
    public List<SystemModels.UserPermission> userPermissions(String id) {
        require("system:user:manage");
        return gateway.userPermissions(requiredId(id));
    }

    /** Replaces one user's direct ALLOW/DENY overrides as one transaction. */
    public List<SystemModels.UserPermission> saveUserPermissions(String id, SystemModels.UserPermissionCommand command) {
        require("system:user:manage");
        return gateway.saveUserPermissions(requiredId(id), command, require("system:user:manage").userId());
    }

    /** Removes all direct overrides so role grants apply again. */
    public List<SystemModels.UserPermission> clearUserPermissions(String id) {
        require("system:user:manage");
        return gateway.clearUserPermissions(requiredId(id), require("system:user:manage").userId());
    }

    /** Returns the enabled permission catalog for the direct-permission editor. */
    public List<SystemModels.PermissionOption> permissionOptions() {
        var principal=com.qiyu.application.auth.AuthContext.current();
        if(!principal.hasPermission("system:user:manage")&&!principal.hasPermission("system:role:manage")&&!principal.hasPermission("system:menu:manage"))throw new SecurityException("没有权限查看权限目录");
        return gateway.permissionOptions().stream().filter(p->principal.hasPermission(p.code())).toList();
    }

    public SystemModels.Page<SystemModels.Role> roles(String keyword, int page, int pageSize) {
        require("system:role:manage");
        return gateway.roles(text(keyword), page(page), pageSize(pageSize));
    }

    public SystemModels.Role saveRole(String id, SystemModels.RoleCommand command) {
        validate(command.code(), "角色编码");
        validate(command.name(), "角色名称");
        return write(() -> gateway.saveRole(id(id), command, require("system:role:manage").userId()));
    }

    public void deleteRole(String id) {
        gateway.deleteRole(requiredId(id), require("system:role:manage").userId());
    }

    public SystemModels.Page<SystemModels.Menu> menus(String keyword, int page, int pageSize) {
        require("system:menu:manage");
        return gateway.menus(text(keyword), page(page), pageSize(pageSize));
    }

    public SystemModels.Menu saveMenu(String id, SystemModels.MenuCommand command) {
        validate(command.name(), "菜单名称");
        validate(command.type(), "菜单类型");
        return write(() -> gateway.saveMenu(id(id), command, require("system:menu:manage").userId()));
    }

    public void deleteMenu(String id) {
        gateway.deleteMenu(requiredId(id), require("system:menu:manage").userId());
    }

    public SystemModels.Page<SystemModels.Dictionary> dictionaries(String keyword, int page, int pageSize) {
        require("system:dict:manage");
        return gateway.dictionaries(text(keyword), page(page), pageSize(pageSize));
    }

    public SystemModels.Dictionary saveDictionary(String id, SystemModels.DictionaryCommand command) {
        validate(command.typeCode(), "字典类型编码");
        validate(command.typeName(), "字典类型名称");
        validate(command.itemLabel(), "选项名称");
        validate(command.itemValue(), "选项值");
        return write(() -> gateway.saveDictionary(id(id), command, require("system:dict:manage").userId()));
    }

    public List<SystemModels.DictionaryType> dictionaryTypes() {
        require("system:dict:manage");
        return gateway.dictionaryTypes();
    }

    public SystemModels.Page<SystemModels.Dictionary> dictionaryItems(String typeCode, String keyword, int page, int pageSize) {
        require("system:dict:manage");
        validate(typeCode, "字典类型");
        return gateway.dictionaryItems(typeCode, text(keyword), page(page), pageSize(pageSize));
    }

    public void deleteDictionary(String id) {
        gateway.deleteDictionary(requiredId(id), require("system:dict:manage").userId());
    }

    public SystemModels.Page<SystemModels.AuditLog> auditLogs(String keyword, int page, int pageSize) {
        require("audit:read");
        return gateway.auditLogs(text(keyword), page(page), pageSize(pageSize));
    }

    private AuthPrincipal require(String permission) {
        return permissions.requirePermission(permission);
    }

    private static int page(int value) { return Math.max(value, 1); }
    private static int pageSize(int value) { return Math.min(Math.max(value, 1), 200); }
    private static String text(String value) { return value == null ? "" : value.trim(); }
    private static Long id(String value) { return value == null ? null : requiredId(value); }

    private static long requiredId(String value) {
        try {
            return Long.parseLong(value);
        } catch (RuntimeException exception) {
            throw new IllegalArgumentException("ID 格式不正确");
        }
    }

    private static void validate(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + "不能为空");
        }
    }

    /** Converts storage uniqueness failures into a stable use-case error for all write endpoints. */
    private static <T> T write(Supplier<T> action) {
        try {
            return action.get();
        } catch (DuplicateKeyException exception) {
            throw new IllegalArgumentException("编码、账号或选项值已存在");
        }
    }
}
