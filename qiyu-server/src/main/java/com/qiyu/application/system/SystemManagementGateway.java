package com.qiyu.application.system;

import com.qiyu.application.system.dto.SystemModels;

import java.util.List;

/**
 * Outbound port for system-management persistence. Management CRUD ports live in the
 * application layer (per project convention), while core business ports live in domain.
 */
public interface SystemManagementGateway {
    List<SystemModels.Organization> organizationTree();
    SystemModels.Page<SystemModels.OrganizationMember> organizationMembers(long id, boolean descendants, int page, int pageSize);
    SystemModels.Page<SystemModels.Organization> organizations(String keyword, int page, int pageSize);
    SystemModels.Organization saveOrganization(Long id, SystemModels.OrganizationCommand command, long operatorId);
    void deleteOrganization(long id, long operatorId);

    SystemModels.Page<SystemModels.User> users(String keyword, int page, int pageSize);
    SystemModels.User saveUser(Long id, SystemModels.UserCommand command, long operatorId);
    void deleteUser(long id, long operatorId);
    void resetUserPassword(long id, String newPassword, long operatorId);

    SystemModels.UserDataScope userDataScope(long userId);
    SystemModels.UserDataScope saveUserDataScope(long userId, SystemModels.UserDataScopeCommand command, long operatorId);
    SystemModels.UserDataScope clearUserDataScope(long userId, long operatorId);
    SystemModels.DataScopeOptions dataScopeOptions();

    List<SystemModels.UserPermission> userPermissions(long userId);
    List<SystemModels.UserPermission> saveUserPermissions(long userId, SystemModels.UserPermissionCommand command, long operatorId);
    List<SystemModels.UserPermission> clearUserPermissions(long userId, long operatorId);
    List<SystemModels.PermissionOption> permissionOptions();

    SystemModels.Page<SystemModels.Role> roles(String keyword, int page, int pageSize);
    SystemModels.Role saveRole(Long id, SystemModels.RoleCommand command, long operatorId);
    void deleteRole(long id, long operatorId);

    SystemModels.Page<SystemModels.Menu> menus(String keyword, int page, int pageSize);
    SystemModels.Menu saveMenu(Long id, SystemModels.MenuCommand command, long operatorId);
    void deleteMenu(long id, long operatorId);

    SystemModels.Page<SystemModels.Dictionary> dictionaries(String keyword, int page, int pageSize);
    List<SystemModels.DictionaryType> dictionaryTypes();
    SystemModels.Page<SystemModels.Dictionary> dictionaryItems(String typeCode, String keyword, int page, int pageSize);
    SystemModels.Dictionary saveDictionary(Long id, SystemModels.DictionaryCommand command, long operatorId);
    void deleteDictionary(long id, long operatorId);

    SystemModels.Page<SystemModels.AuditLog> auditLogs(String keyword, int page, int pageSize);
}
