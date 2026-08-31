package com.qiyu.application.system;

import java.util.List;
import java.time.LocalDateTime;

/** API-facing system management views and commands, independent of persistence entities. */
public final class SystemModels {
    private SystemModels() { }

    /** Stable pagination envelope shared by all system management lists. */
    public record Page<T>(List<T> records, long total) { }

    public record Organization(String id, String parentId, String name, String type, String leader,
                               int sort, String status) { }

    public record User(String id, String username, String displayName, String phone, String departmentName,
                       List<String> roleNames, String dataScope, String status, String lastLoginAt) { }

    public record Role(String id, String code, String name, List<String> permissionCodes,
                       List<String> deniedPermissionCodes, String dataScope, long userCount, String status) { }

    public record Menu(String id, String parentId, String name, String path, String permissionCode,
                       String type, int sort, boolean visible, String status) { }

    public record Dictionary(String id, String typeCode, String typeName, String itemLabel, String itemValue,
                             int sort, String status, String remark) { }

    public record AuditLog(String id, String operatorName, String action, String resourceType,
                           String resourceId, String organizationName, String result, String ipAddress,
                           String detail, String createdAt) { }

    /** Write contract used by both organization creation and replacement-style updates. */
    public record OrganizationCommand(String parentId, String name, String type, String leader,
                                      Integer sort, String status) { }

    public record UserCommand(String username, String displayName, String phone, String departmentName,
                              List<String> roleNames, String dataScope, String status) { }

    /** Write-only command for an administrator-initiated credential reset. */
    public record PasswordResetCommand(String newPassword) { }

    /** Complete user-level data-scope override used for multi-store and temporary assignments. */
    public record UserDataScope(String userId, String scopeType, List<String> storeIds,
                                List<String> regionIds, LocalDateTime validFrom, LocalDateTime validUntil,
                                boolean inherited) { }

    /** Replacement command for one user's cross-resource data-scope override. */
    public record UserDataScopeCommand(String scopeType, List<String> storeIds, List<String> regionIds,
                                       LocalDateTime validFrom, LocalDateTime validUntil) { }

    /** Select option backed by a stable database identity rather than a display name. */
    public record ScopeOption(String id, String name) { }

    /** Store and region choices available to the authorization editor. */
    public record DataScopeOptions(List<ScopeOption> stores, List<ScopeOption> regions) { }

    public record RoleCommand(String code, String name, List<String> permissionCodes,
                              List<String> deniedPermissionCodes, String dataScope, String status) { }

    public record MenuCommand(String parentId, String name, String path, String permissionCode,
                              String type, Integer sort, Boolean visible, String status) { }

    public record DictionaryCommand(String typeCode, String typeName, String itemLabel, String itemValue,
                                    Integer sort, String status, String remark) { }
}
