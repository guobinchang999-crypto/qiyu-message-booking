package com.qiyu.infrastructure.persistence.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.qiyu.infrastructure.persistence.entity.SystemAuditEntity;
import com.qiyu.infrastructure.persistence.entity.SystemDictionaryEntity;
import com.qiyu.infrastructure.persistence.entity.SystemMenuEntity;
import com.qiyu.infrastructure.persistence.entity.SystemOrganizationEntity;
import com.qiyu.infrastructure.persistence.entity.SystemRoleEntity;
import com.qiyu.infrastructure.persistence.entity.SystemUserEntity;
import org.apache.ibatis.annotations.Delete;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Options;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

import java.time.LocalDateTime;
import java.util.List;

/**
 * MyBatis-Plus persistence boundary for system management.
 *
 * <p>Every statement is explicit and parameterized. Complex list projections intentionally live here so the
 * repository remains responsible for orchestration and mapping, rather than assembling executable SQL text.</p>
 */
public interface SystemManagementMapper extends BaseMapper<SystemUserEntity> {
    /** Returns the persisted organization rows required by the system-management list contract. */
    @Select("""
            SELECT COUNT(*) FROM sys_dept d
            LEFT JOIN sys_user leader ON leader.id=d.leader_user_id
            WHERE d.deleted=0 AND (#{keyword}='' OR d.dept_name LIKE #{pattern} OR d.dept_code LIKE #{pattern})
            """)
    long countOrganizations(@Param("keyword") String keyword, @Param("pattern") String pattern);

    @Select("""
            SELECT d.id,d.parent_id parentId,d.dept_code deptCode,d.dept_name deptName,
                   COALESCE(leader.display_name,'') leader,d.sort_order sortOrder,d.status
            FROM sys_dept d LEFT JOIN sys_user leader ON leader.id=d.leader_user_id AND leader.deleted=0
            WHERE d.deleted=0 AND (#{keyword}='' OR d.dept_name LIKE #{pattern} OR d.dept_code LIKE #{pattern})
            ORDER BY d.sort_order,d.id LIMIT #{limit} OFFSET #{offset}
            """)
    List<SystemOrganizationProjection> organizations(@Param("keyword") String keyword,
                                                      @Param("pattern") String pattern,
                                                      @Param("limit") int limit,
                                                      @Param("offset") int offset);

    @Insert("""
            INSERT INTO sys_dept(parent_id,dept_code,dept_name,leader_user_id,sort_order,status)
            VALUES(#{parentId},#{code},#{name},#{leaderUserId},#{sortOrder},#{status})
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertOrganization(SystemOrganizationEntity entity);

    @Update("""
            UPDATE sys_dept SET parent_id=#{parentId},dept_name=#{name},leader_user_id=#{leaderUserId},
              sort_order=#{sortOrder},status=#{status},updated_at=NOW() WHERE id=#{id} AND deleted=0
            """)
    int updateOrganization(SystemOrganizationEntity entity);

    @Select("SELECT id FROM sys_user WHERE display_name=#{displayName} AND deleted=0 ORDER BY id LIMIT 1")
    Long findUserIdByDisplayName(String displayName);

    @Select("SELECT COUNT(*) FROM sys_dept WHERE id=#{id} AND deleted=0") long organizationExists(long id);
    @Select("SELECT COUNT(*) FROM sys_dept WHERE parent_id=#{id} AND deleted=0") long childOrganizationCount(long id);
    @Select("SELECT COUNT(*) FROM sys_user_dept WHERE dept_id=#{id}") long organizationUserCount(long id);
    @Update("UPDATE sys_dept SET deleted=1,status='DISABLED',updated_at=NOW() WHERE id=#{id}") int deleteOrganization(long id);

    /** Returns staff accounts with their aggregated role and data-scope labels. */
    @Select("""
            SELECT COUNT(DISTINCT u.id) FROM sys_user u
            LEFT JOIN sys_user_identity i ON i.user_id=u.id AND i.identity_type='PASSWORD' AND i.deleted=0
            LEFT JOIN staff s ON s.user_id=u.id AND s.deleted=0
            WHERE u.deleted=0 AND u.user_type='STAFF'
              AND (#{keyword}='' OR u.display_name LIKE #{pattern} OR i.identifier LIKE #{pattern} OR s.mobile LIKE #{pattern})
            """)
    long countUsers(@Param("keyword") String keyword, @Param("pattern") String pattern);

    @Select("""
            SELECT u.id,COALESCE(MAX(i.identifier),'') username,u.display_name displayName,
              COALESCE(MAX(s.mobile),'') phone,COALESCE(MAX(d.dept_name),'') departmentName,
              COALESCE(GROUP_CONCAT(DISTINCT r.role_name ORDER BY r.role_name SEPARATOR ','),'') roleNames,
              COALESCE(GROUP_CONCAT(DISTINCT COALESCE(uds.scope_type,ds.scope_type)
                ORDER BY COALESCE(uds.scope_type,ds.scope_type) SEPARATOR ','),'') dataScopes,
              u.status,MAX(i.last_login_at) lastLoginAt
            FROM sys_user u
            LEFT JOIN sys_user_identity i ON i.user_id=u.id AND i.identity_type='PASSWORD' AND i.deleted=0
            LEFT JOIN staff s ON s.user_id=u.id AND s.deleted=0
            LEFT JOIN sys_user_dept ud ON ud.user_id=u.id AND ud.is_primary=1
            LEFT JOIN sys_dept d ON d.id=ud.dept_id AND d.deleted=0
            LEFT JOIN sys_user_role ur ON ur.user_id=u.id
            LEFT JOIN sys_role r ON r.id=ur.role_id AND r.deleted=0
            LEFT JOIN sys_role_data_scope ds ON ds.role_id=r.id
            LEFT JOIN sys_user_data_scope uds ON uds.user_id=u.id
            WHERE u.deleted=0 AND u.user_type='STAFF'
              AND (#{keyword}='' OR u.display_name LIKE #{pattern} OR i.identifier LIKE #{pattern} OR s.mobile LIKE #{pattern})
            GROUP BY u.id,u.display_name,u.status ORDER BY u.id DESC LIMIT #{limit} OFFSET #{offset}
            """)
    List<SystemUserProjection> users(@Param("keyword") String keyword,
                                     @Param("pattern") String pattern,
                                     @Param("limit") int limit,
                                     @Param("offset") int offset);

    @Insert("INSERT INTO sys_user(user_type,display_name,status,created_by) VALUES('STAFF',#{displayName},#{status},#{createdBy})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    int insertSystemUser(SystemUserEntity entity);

    @Select("SELECT COUNT(*) FROM sys_user WHERE id=#{id} AND deleted=0") long userExists(long id);
    @Update("UPDATE sys_user SET display_name=#{displayName},status=#{status},updated_by=#{operator},updated_at=NOW() WHERE id=#{id} AND deleted=0")
    int updateSystemUser(@Param("id") long id, @Param("displayName") String displayName, @Param("status") String status, @Param("operator") String operator);
    @Insert("INSERT INTO sys_user_identity(user_id,identity_type,identifier,verified,status,created_by) VALUES(#{id},'PASSWORD',#{username},1,#{status},#{operator})")
    int insertIdentity(@Param("id") long id, @Param("username") String username, @Param("status") String status, @Param("operator") String operator);
    @Update("UPDATE sys_user_identity SET identifier=#{username},status=#{status},updated_by=#{operator},updated_at=NOW() WHERE user_id=#{id} AND identity_type='PASSWORD' AND deleted=0")
    int updateIdentity(@Param("id") long id, @Param("username") String username, @Param("status") String status, @Param("operator") String operator);
    @Insert("INSERT INTO staff(user_id,employee_no,mobile,status,created_by) VALUES(#{id},#{employeeNo},#{phone},#{status},#{operator})")
    int insertStaff(@Param("id") long id, @Param("employeeNo") String employeeNo, @Param("phone") String phone, @Param("status") String status, @Param("operator") String operator);
    @Update("UPDATE staff SET mobile=#{phone},status=#{status},updated_by=#{operator},updated_at=NOW() WHERE user_id=#{id} AND deleted=0")
    int updateStaff(@Param("id") long id, @Param("phone") String phone, @Param("status") String status, @Param("operator") String operator);
    @Update("UPDATE sys_user SET deleted=1,status='DISABLED',updated_by=#{operator},updated_at=NOW() WHERE id=#{id}") int softDeleteUser(@Param("id") long id, @Param("operator") String operator);
    @Update("UPDATE sys_user_identity SET deleted=1,status='DISABLED',updated_by=#{operator},updated_at=NOW() WHERE user_id=#{id}") int softDeleteIdentities(@Param("id") long id, @Param("operator") String operator);
    @Update("UPDATE staff SET deleted=1,status='DISABLED',updated_by=#{operator},updated_at=NOW() WHERE user_id=#{id}") int softDeleteStaff(@Param("id") long id, @Param("operator") String operator);
    @Update("UPDATE sys_user_identity SET credential_hash=#{hash},updated_by=#{operator},updated_at=NOW() WHERE user_id=#{id} AND identity_type='PASSWORD' AND deleted=0")
    int updatePasswordHash(@Param("id") long id, @Param("hash") String hash, @Param("operator") String operator);

    @Select("SELECT id FROM sys_dept WHERE dept_name=#{name} AND deleted=0 ORDER BY id LIMIT 1") Long departmentId(String name);
    @Select("SELECT id FROM sys_role WHERE role_name=#{name} AND deleted=0 ORDER BY id LIMIT 1") Long roleIdByName(String name);
    @Delete("DELETE FROM sys_user_dept WHERE user_id=#{id}") int deleteUserDepartments(long id);
    @Insert("INSERT INTO sys_user_dept(user_id,dept_id,is_primary) VALUES(#{userId},#{deptId},1)") int insertUserDepartment(@Param("userId") long userId, @Param("deptId") long deptId);
    @Delete("DELETE FROM sys_user_role WHERE user_id=#{id}") int deleteUserRoles(long id);
    @Insert("INSERT INTO sys_user_role(user_id,role_id) VALUES(#{userId},#{roleId})") int insertUserRole(@Param("userId") long userId, @Param("roleId") long roleId);
    @Delete("DELETE FROM sys_user_data_scope WHERE user_id=#{id}") int deleteUserScopes(long id);
    @Insert("INSERT INTO sys_user_data_scope(user_id,resource_code,action_code,scope_type,valid_from,valid_until,created_by_user_id) VALUES(#{userId},#{resource},'*',#{scope},#{validFrom},#{validUntil},#{operatorId})")
    int insertUserScope(@Param("userId") long userId, @Param("resource") String resource,
                        @Param("scope") String scope, @Param("validFrom") LocalDateTime validFrom,
                        @Param("validUntil") LocalDateTime validUntil, @Param("operatorId") long operatorId);

    /** Reads one row because the application writes one uniform override across scoped resources. */
    @Select("SELECT scope_type scopeType,valid_from validFrom,valid_until validUntil FROM sys_user_data_scope WHERE user_id=#{userId} ORDER BY id LIMIT 1")
    UserDataScopeRow userDataScope(long userId);

    @Select("SELECT DISTINCT CONCAT('store-',LOWER(REPLACE(s.store_code,'_','-'))) FROM sys_user_scope_store us JOIN store s ON s.id=us.store_id AND s.deleted=0 WHERE us.user_id=#{userId} ORDER BY 1")
    List<String> userScopeStoreIds(long userId);

    @Select("SELECT DISTINCT CAST(r.id AS CHAR) FROM sys_user_scope_region ur JOIN region r ON r.id=ur.region_id AND r.deleted=0 WHERE ur.user_id=#{userId} ORDER BY 1")
    List<String> userScopeRegionIds(long userId);

    @Delete("DELETE FROM sys_user_scope_store WHERE user_id=#{userId}") int deleteUserScopeStores(long userId);
    @Delete("DELETE FROM sys_user_scope_region WHERE user_id=#{userId}") int deleteUserScopeRegions(long userId);

    @Insert("""
            INSERT INTO sys_user_scope_store(user_id,resource_code,action_code,store_id,valid_from,valid_until,created_by_user_id)
            SELECT #{userId},#{resource},'*',s.id,#{validFrom},#{validUntil},#{operatorId}
            FROM store s
            WHERE s.deleted=0 AND CONCAT('store-',LOWER(REPLACE(s.store_code,'_','-')))=#{storeId}
            """)
    int insertUserScopeStore(@Param("userId") long userId, @Param("resource") String resource,
                             @Param("storeId") String storeId, @Param("validFrom") LocalDateTime validFrom,
                             @Param("validUntil") LocalDateTime validUntil, @Param("operatorId") long operatorId);

    @Insert("""
            INSERT INTO sys_user_scope_region(user_id,resource_code,action_code,region_id,valid_from,valid_until,created_by_user_id)
            SELECT #{userId},#{resource},'*',r.id,#{validFrom},#{validUntil},#{operatorId}
            FROM region r WHERE r.deleted=0 AND CAST(r.id AS CHAR)=#{regionId}
            """)
    int insertUserScopeRegion(@Param("userId") long userId, @Param("resource") String resource,
                              @Param("regionId") String regionId, @Param("validFrom") LocalDateTime validFrom,
                              @Param("validUntil") LocalDateTime validUntil, @Param("operatorId") long operatorId);

    @Select("SELECT CONCAT('store-',LOWER(REPLACE(store_code,'_','-'))) id,store_name name FROM store WHERE deleted=0 AND enabled=1 ORDER BY sort_order,id")
    List<ScopeOptionRow> dataScopeStoreOptions();

    @Select("SELECT CAST(id AS CHAR) id,region_name name FROM region WHERE deleted=0 AND status='ENABLED' ORDER BY sort_order,id")
    List<ScopeOptionRow> dataScopeRegionOptions();

    @Select("SELECT COUNT(*) FROM sys_role WHERE deleted=0 AND (#{keyword}='' OR role_code LIKE #{pattern} OR role_name LIKE #{pattern})")
    long countRoles(@Param("keyword") String keyword, @Param("pattern") String pattern);
    /** Returns roles with their effective allow permissions and configured data scopes. */
    @Select("""
            SELECT r.id,r.role_code roleCode,r.role_name roleName,
              COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN rp.effect='ALLOW' THEN p.permission_code END ORDER BY p.permission_code SEPARATOR ','),'') permissionCodes,
              COALESCE(GROUP_CONCAT(DISTINCT CASE WHEN rp.effect='DENY' THEN p.permission_code END ORDER BY p.permission_code SEPARATOR ','),'') deniedPermissionCodes,
              COALESCE(GROUP_CONCAT(DISTINCT ds.scope_type ORDER BY ds.scope_type SEPARATOR ','),'') dataScopes,
              (SELECT COUNT(*) FROM sys_user_role ur WHERE ur.role_id=r.id) userCount,r.status
            FROM sys_role r LEFT JOIN sys_role_permission rp ON rp.role_id=r.id
            LEFT JOIN sys_permission p ON p.id=rp.permission_id AND p.deleted=0
            LEFT JOIN sys_role_data_scope ds ON ds.role_id=r.id
            WHERE r.deleted=0 AND (#{keyword}='' OR r.role_code LIKE #{pattern} OR r.role_name LIKE #{pattern})
            GROUP BY r.id,r.role_code,r.role_name,r.status ORDER BY r.id LIMIT #{limit} OFFSET #{offset}
            """)
    List<SystemRoleProjection> roles(@Param("keyword") String keyword,
                                     @Param("pattern") String pattern,
                                     @Param("limit") int limit,
                                     @Param("offset") int offset);
    @Insert("INSERT INTO sys_role(role_code,role_name,status,created_by) VALUES(#{code},#{name},#{status},#{createdBy})")
    @Options(useGeneratedKeys = true, keyProperty = "id") int insertRole(SystemRoleEntity entity);
    @Select("SELECT COUNT(*) FROM sys_role WHERE id=#{id} AND deleted=0") long roleExists(long id);
    @Update("UPDATE sys_role SET role_code=#{code},role_name=#{name},status=#{status},updated_by=#{operator},updated_at=NOW() WHERE id=#{id} AND deleted=0")
    int updateRole(@Param("id") long id, @Param("code") String code, @Param("name") String name, @Param("status") String status, @Param("operator") String operator);
    @Select("SELECT id FROM sys_permission WHERE permission_code=#{code} AND deleted=0") Long permissionId(String code);
    @Delete("DELETE FROM sys_role_permission WHERE role_id=#{id}") int deleteRolePermissions(long id);
    @Insert("INSERT INTO sys_role_permission(role_id,permission_id,effect) VALUES(#{roleId},#{permissionId},#{effect})")
    int insertRolePermission(@Param("roleId") long roleId, @Param("permissionId") long permissionId,
                             @Param("effect") String effect);
    @Delete("DELETE FROM sys_role_data_scope WHERE role_id=#{id}") int deleteRoleScopes(long id);
    @Insert("INSERT INTO sys_role_data_scope(role_id,resource_code,action_code,scope_type) VALUES(#{roleId},#{resource},'*',#{scope})") int insertRoleScope(@Param("roleId") long roleId, @Param("resource") String resource, @Param("scope") String scope);
    @Select("SELECT COUNT(*) FROM sys_user_role WHERE role_id=#{id}") long roleUserCount(long id);
    @Update("UPDATE sys_role SET deleted=1,status='DISABLED',updated_by=#{operator},updated_at=NOW() WHERE id=#{id}") int softDeleteRole(@Param("id") long id, @Param("operator") String operator);
    @Delete("DELETE FROM sys_role_menu WHERE role_id=#{id}") int deleteRoleMenus(long id);

    @Select("""
            SELECT p.permission_code permissionCode, up.effect effect
            FROM sys_user_permission up JOIN sys_permission p ON p.id=up.permission_id
            WHERE up.user_id=#{userId} ORDER BY p.permission_code
            """)
    List<SystemUserPermissionRow> userPermissions(long userId);
    @Delete("DELETE FROM sys_user_permission WHERE user_id=#{id}") int deleteUserPermissions(long id);
    @Insert("INSERT INTO sys_user_permission(user_id,permission_id,effect,created_by_user_id) VALUES(#{userId},#{permissionId},#{effect},#{operatorId})")
    int insertUserPermission(@Param("userId") long userId, @Param("permissionId") long permissionId,
                             @Param("effect") String effect, @Param("operatorId") long operatorId);
    @Select("SELECT permission_code code, permission_name name FROM sys_permission WHERE deleted=0 AND status='ENABLED' ORDER BY permission_code")
    List<SystemPermissionOptionRow> permissionOptions();

    @Select("SELECT COUNT(*) FROM sys_menu WHERE deleted=0 AND (#{keyword}='' OR menu_name LIKE #{pattern} OR menu_code LIKE #{pattern} OR permission_code LIKE #{pattern})")
    long countMenus(@Param("keyword") String keyword, @Param("pattern") String pattern);
    /** Returns menu rows in their persisted display order. */
    @Select("""
            SELECT id,parent_id parentId,menu_name menuName,COALESCE(route_path,'') routePath,
              COALESCE(permission_code,'') permissionCode,menu_type menuType,sort_order sortOrder,status
            FROM sys_menu WHERE deleted=0
              AND (#{keyword}='' OR menu_name LIKE #{pattern} OR menu_code LIKE #{pattern} OR permission_code LIKE #{pattern})
            ORDER BY sort_order,id LIMIT #{limit} OFFSET #{offset}
            """)
    List<SystemMenuProjection> menus(@Param("keyword") String keyword,
                                     @Param("pattern") String pattern,
                                     @Param("limit") int limit,
                                     @Param("offset") int offset);
    @Insert("INSERT INTO sys_menu(parent_id,menu_code,menu_name,menu_type,route_path,permission_code,sort_order,status,created_by) VALUES(#{parentId},#{code},#{name},#{type},#{path},#{permissionCode},#{sortOrder},#{status},#{createdBy})")
    @Options(useGeneratedKeys = true, keyProperty = "id") int insertMenu(SystemMenuEntity entity);
    @Select("SELECT COUNT(*) FROM sys_menu WHERE id=#{id} AND deleted=0") long menuExists(long id);
    @Update("UPDATE sys_menu SET parent_id=#{parentId},menu_name=#{name},menu_type=#{type},route_path=#{path},permission_code=#{permissionCode},sort_order=#{sortOrder},status=#{status},updated_by=#{operator},updated_at=NOW() WHERE id=#{id} AND deleted=0")
    int updateMenu(@Param("id") long id, @Param("parentId") long parentId, @Param("name") String name, @Param("type") String type, @Param("path") String path, @Param("permissionCode") String permissionCode, @Param("sortOrder") int sortOrder, @Param("status") String status, @Param("operator") String operator);
    @Select("SELECT COUNT(*) FROM sys_menu WHERE parent_id=#{id} AND deleted=0") long childMenuCount(long id);
    @Update("UPDATE sys_menu SET deleted=1,status='DISABLED',updated_by=#{operator},updated_at=NOW() WHERE id=#{id}") int softDeleteMenu(@Param("id") long id, @Param("operator") String operator);
    @Delete("DELETE FROM sys_role_menu WHERE menu_id=#{id}") int deleteMenuRoles(long id);

    /** Returns dictionary items together with the owning dictionary-type metadata. */
    @Select("""
            SELECT COUNT(*) FROM dict_item i JOIN dict_type t ON t.type_code=i.type_code AND t.deleted=0
            WHERE i.deleted=0 AND (#{keyword}='' OR t.type_code LIKE #{pattern} OR t.type_name LIKE #{pattern}
              OR i.item_label LIKE #{pattern} OR i.item_value LIKE #{pattern})
            """)
    long countDictionaries(@Param("keyword") String keyword, @Param("pattern") String pattern);
    @Select("""
            SELECT i.id,t.type_code typeCode,t.type_name typeName,i.item_label itemLabel,i.item_value itemValue,
              i.sort_order sortOrder,i.enabled,t.description
            FROM dict_item i JOIN dict_type t ON t.type_code=i.type_code AND t.deleted=0
            WHERE i.deleted=0 AND (#{keyword}='' OR t.type_code LIKE #{pattern} OR t.type_name LIKE #{pattern}
              OR i.item_label LIKE #{pattern} OR i.item_value LIKE #{pattern})
            ORDER BY t.sort_order,i.sort_order,i.id LIMIT #{limit} OFFSET #{offset}
            """)
    List<SystemDictionaryProjection> dictionaries(@Param("keyword") String keyword,
                                                   @Param("pattern") String pattern,
                                                   @Param("limit") int limit,
                                                   @Param("offset") int offset);
    @Update("UPDATE dict_type SET type_name=#{name},description=#{description},updated_by=#{operator},updated_at=NOW() WHERE type_code=#{code} AND deleted=0")
    int updateDictionaryType(@Param("code") String code, @Param("name") String name, @Param("description") String description, @Param("operator") String operator);
    @Insert("INSERT INTO dict_type(type_code,type_name,description,enabled,created_by) VALUES(#{code},#{name},#{description},#{enabled},#{operator})")
    int insertDictionaryType(@Param("code") String code, @Param("name") String name, @Param("description") String description, @Param("enabled") int enabled, @Param("operator") String operator);
    @Insert("INSERT INTO dict_item(type_code,item_code,item_label,item_value,enabled,sort_order,created_by) VALUES(#{typeCode},#{itemCode},#{itemLabel},#{itemValue},#{enabled},#{sortOrder},#{createdBy})")
    @Options(useGeneratedKeys = true, keyProperty = "id") int insertDictionary(SystemDictionaryEntity entity);
    @Select("SELECT COUNT(*) FROM dict_item WHERE id=#{id} AND deleted=0") long dictionaryExists(long id);
    @Update("UPDATE dict_item SET type_code=#{typeCode},item_label=#{label},item_value=#{value},enabled=#{enabled},sort_order=#{sortOrder},updated_by=#{operator},updated_at=NOW() WHERE id=#{id} AND deleted=0")
    int updateDictionary(@Param("id") long id, @Param("typeCode") String typeCode, @Param("label") String label, @Param("value") String value, @Param("enabled") int enabled, @Param("sortOrder") int sortOrder, @Param("operator") String operator);
    @Update("UPDATE dict_item SET deleted=1,enabled=0,updated_by=#{operator},updated_at=NOW() WHERE id=#{id}") int softDeleteDictionary(@Param("id") long id, @Param("operator") String operator);

    /** Returns audit entries enriched with operator and store display names. */
    @Select("""
            SELECT COUNT(*) FROM audit_log a LEFT JOIN sys_user u ON u.id=a.operator_user_id LEFT JOIN store s ON s.id=a.store_id
            WHERE (#{keyword}='' OR u.display_name LIKE #{pattern} OR a.action_code LIKE #{pattern}
              OR a.resource_type LIKE #{pattern} OR a.resource_id LIKE #{pattern})
            """)
    long countAuditLogs(@Param("keyword") String keyword, @Param("pattern") String pattern);
    @Select("""
            SELECT a.id,COALESCE(u.display_name,'系统') operatorName,a.action_code actionCode,a.resource_type resourceType,
              a.resource_id resourceId,COALESCE(s.store_name,'-') organizationName,COALESCE(a.request_id,'-') requestId,
              COALESCE(CAST(a.after_data AS CHAR),CAST(a.before_data AS CHAR),'{}') detail,a.created_at createdAt
            FROM audit_log a LEFT JOIN sys_user u ON u.id=a.operator_user_id LEFT JOIN store s ON s.id=a.store_id
            WHERE (#{keyword}='' OR u.display_name LIKE #{pattern} OR a.action_code LIKE #{pattern}
              OR a.resource_type LIKE #{pattern} OR a.resource_id LIKE #{pattern})
            ORDER BY a.created_at DESC LIMIT #{limit} OFFSET #{offset}
            """)
    List<SystemAuditLogProjection> auditLogs(@Param("keyword") String keyword,
                                             @Param("pattern") String pattern,
                                             @Param("limit") int limit,
                                             @Param("offset") int offset);

    @Insert("INSERT INTO audit_log(operator_user_id,action_code,resource_type,resource_id,after_data) VALUES(#{operatorId},#{action},#{resourceType},#{resourceId},JSON_OBJECT('source','system-management'))")
    int insertAudit(SystemAuditEntity entity);
}
