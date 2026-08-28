package com.qiyu.infrastructure.persistence.mapper;

import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.Collection;
import java.util.List;
import java.util.Map;

/** Read model for effective authentication and authorization snapshots. */
public interface AuthAccessMapper {
    @Select("""
            SELECT u.id user_id,u.user_type,u.display_name,i.credential_hash,c.id customer_id,t.therapist_code
            FROM sys_user_identity i JOIN sys_user u ON u.id=i.user_id
            LEFT JOIN customer c ON c.user_id=u.id AND c.deleted=0
            LEFT JOIN staff s ON s.user_id=u.id AND s.deleted=0
            LEFT JOIN therapist t ON t.staff_id=s.id AND t.deleted=0
            WHERE i.identity_type=#{identityType} AND i.identifier=#{identifier} AND i.status='ENABLED' AND i.deleted=0
              AND u.status='ENABLED' AND u.deleted=0
            """)
    List<Map<String, Object>> findIdentity(@Param("identityType") String identityType, @Param("identifier") String identifier);

    @Select("""
            SELECT u.id user_id,u.user_type,u.display_name,c.id customer_id,t.therapist_code
            FROM sys_user u LEFT JOIN customer c ON c.user_id=u.id AND c.deleted=0
            LEFT JOIN staff s ON s.user_id=u.id AND s.deleted=0 LEFT JOIN therapist t ON t.staff_id=s.id AND t.deleted=0
            WHERE u.id=#{userId} AND u.status='ENABLED' AND u.deleted=0
            """)
    List<Map<String, Object>> findUser(long userId);

    @Select("SELECT r.role_code FROM sys_user_role ur JOIN sys_role r ON r.id=ur.role_id WHERE ur.user_id=#{userId} AND r.status='ENABLED' AND r.deleted=0")
    List<String> roleCodes(long userId);

    @Select("""
            SELECT p.permission_code,rp.effect FROM sys_user_role ur
              JOIN sys_role_permission rp ON rp.role_id=ur.role_id JOIN sys_permission p ON p.id=rp.permission_id
              WHERE ur.user_id=#{userId} AND p.status='ENABLED' AND p.deleted=0
            UNION ALL
            SELECT p.permission_code,up.effect FROM sys_user_permission up JOIN sys_permission p ON p.id=up.permission_id
              WHERE up.user_id=#{userId} AND p.status='ENABLED' AND p.deleted=0
                AND (up.valid_from IS NULL OR up.valid_from<=NOW()) AND (up.valid_until IS NULL OR up.valid_until>NOW())
            """)
    List<Map<String, Object>> permissionGrants(long userId);

    @Select("SELECT resource_code,action_code,scope_type FROM sys_user_data_scope WHERE user_id=#{userId} AND (valid_from IS NULL OR valid_from<=NOW()) AND (valid_until IS NULL OR valid_until>NOW())")
    List<Map<String, Object>> userScopes(long userId);

    @Select("SELECT ds.resource_code,ds.action_code,ds.scope_type FROM sys_user_role ur JOIN sys_role_data_scope ds ON ds.role_id=ur.role_id WHERE ur.user_id=#{userId}")
    List<Map<String, Object>> roleScopes(long userId);

    @Select("SELECT CONCAT('store-',LOWER(REPLACE(s.store_code,'_','-'))) FROM staff f JOIN store s ON s.id=f.primary_store_id WHERE f.user_id=#{userId} AND f.deleted=0 AND s.deleted=0")
    List<String> primaryStores(long userId);

    @Select("""
            SELECT CONCAT('store-',LOWER(REPLACE(s.store_code,'_','-'))) FROM sys_user_scope_store us
            JOIN store s ON s.id=us.store_id WHERE us.user_id=#{userId} AND us.resource_code=#{resource} AND us.action_code=#{action}
              AND (us.valid_from IS NULL OR us.valid_from<=NOW()) AND (us.valid_until IS NULL OR us.valid_until>NOW())
            """)
    List<String> userStores(@Param("userId") long userId, @Param("resource") String resource, @Param("action") String action);

    @Select("""
            SELECT DISTINCT CONCAT('store-',LOWER(REPLACE(s.store_code,'_','-'))) FROM sys_user_role ur
            JOIN sys_role_scope_store rs ON rs.role_id=ur.role_id JOIN store s ON s.id=rs.store_id
            WHERE ur.user_id=#{userId} AND rs.resource_code=#{resource} AND rs.action_code=#{action}
            """)
    List<String> roleStores(@Param("userId") long userId, @Param("resource") String resource, @Param("action") String action);

    @Select("SELECT CAST(region_id AS CHAR) FROM sys_user_scope_region WHERE user_id=#{userId} AND resource_code=#{resource} AND action_code=#{action} AND (valid_from IS NULL OR valid_from<=NOW()) AND (valid_until IS NULL OR valid_until>NOW())")
    List<String> userRegions(@Param("userId") long userId, @Param("resource") String resource, @Param("action") String action);

    @Select("SELECT DISTINCT CAST(rr.region_id AS CHAR) FROM sys_user_role ur JOIN sys_role_scope_region rr ON rr.role_id=ur.role_id WHERE ur.user_id=#{userId} AND rr.resource_code=#{resource} AND rr.action_code=#{action}")
    List<String> roleRegions(@Param("userId") long userId, @Param("resource") String resource, @Param("action") String action);

    @Select("""
            <script>
            WITH RECURSIVE region_tree AS (
              SELECT id FROM region WHERE id IN
              <foreach collection='regionIds' item='id' open='(' separator=',' close=')'>#{id}</foreach>
              AND deleted=0
              UNION ALL SELECT r.id FROM region r JOIN region_tree p ON r.parent_id=p.id WHERE r.deleted=0)
            SELECT DISTINCT CONCAT('store-',LOWER(REPLACE(s.store_code,'_','-')))
            FROM store s JOIN region_tree rt ON rt.id=s.region_id WHERE s.deleted=0 AND s.enabled=1
            </script>
            """)
    List<String> storesInRegions(@Param("regionIds") Collection<String> regionIds);
}
