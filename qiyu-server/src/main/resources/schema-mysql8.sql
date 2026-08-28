-- Qiyu massage booking schema for MySQL 8.0.
-- This DDL models the unified-brand booking flow shown in design/client-*-v2.png
-- and DEVELOPMENT-PLAN.md. Store type, independent merchant identity, and
-- store-level membership concepts are intentionally not modeled.

CREATE DATABASE IF NOT EXISTS qiyu_booking
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE qiyu_booking;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS review_image;
DROP TABLE IF EXISTS review_tag;
DROP TABLE IF EXISTS service_review;
DROP TABLE IF EXISTS coupon_usage;
DROP TABLE IF EXISTS customer_coupon;
DROP TABLE IF EXISTS coupon_template;
DROP TABLE IF EXISTS member_package_usage;
DROP TABLE IF EXISTS member_package_item;
DROP TABLE IF EXISTS member_package_card;
DROP TABLE IF EXISTS member_balance_transaction;
DROP TABLE IF EXISTS member_account;
DROP TABLE IF EXISTS report_job_run;
DROP TABLE IF EXISTS therapist_daily_metrics;
DROP TABLE IF EXISTS service_daily_metrics;
DROP TABLE IF EXISTS store_daily_metrics;
DROP TABLE IF EXISTS refund_order;
DROP TABLE IF EXISTS payment_order;
DROP TABLE IF EXISTS resource_occupation;
DROP TABLE IF EXISTS service_order_log;
DROP TABLE IF EXISTS service_order;
DROP TABLE IF EXISTS checkin_record;
DROP TABLE IF EXISTS booking_status_log;
DROP TABLE IF EXISTS booking;
DROP TABLE IF EXISTS time_slot_snapshot;
DROP TABLE IF EXISTS therapist_leave;
DROP TABLE IF EXISTS therapist_schedule;
DROP TABLE IF EXISTS therapist_service;
DROP TABLE IF EXISTS therapist_skill;
DROP TABLE IF EXISTS therapist;
DROP TABLE IF EXISTS room;
DROP TABLE IF EXISTS service_item_tag;
DROP TABLE IF EXISTS service_item;
DROP TABLE IF EXISTS service_category;
DROP TABLE IF EXISTS customer_contact;
DROP TABLE IF EXISTS customer_favorite_store;
DROP TABLE IF EXISTS customer;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS customer_store_relation;
DROP TABLE IF EXISTS sys_user_permission;
DROP TABLE IF EXISTS sys_user_scope_region;
DROP TABLE IF EXISTS sys_user_scope_store;
DROP TABLE IF EXISTS sys_user_data_scope;
DROP TABLE IF EXISTS sys_role_scope_region;
DROP TABLE IF EXISTS sys_role_scope_store;
DROP TABLE IF EXISTS sys_role_data_scope;
DROP TABLE IF EXISTS sys_role_menu;
DROP TABLE IF EXISTS sys_role_permission;
DROP TABLE IF EXISTS sys_user_role;
DROP TABLE IF EXISTS sys_menu;
DROP TABLE IF EXISTS sys_permission;
DROP TABLE IF EXISTS sys_role;
DROP TABLE IF EXISTS sys_session;
DROP TABLE IF EXISTS sys_user_identity;
DROP TABLE IF EXISTS sys_user;
DROP TABLE IF EXISTS sys_user_dept;
DROP TABLE IF EXISTS sys_dept;
DROP TABLE IF EXISTS staff;
DROP TABLE IF EXISTS store_service;
DROP TABLE IF EXISTS store_facility;
DROP TABLE IF EXISTS store_gallery;
DROP TABLE IF EXISTS store_business_day;
DROP TABLE IF EXISTS store;
DROP TABLE IF EXISTS region;
DROP TABLE IF EXISTS dict_item;
DROP TABLE IF EXISTS dict_type;


CREATE TABLE dict_type (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  type_code VARCHAR(64) NOT NULL COMMENT '字典类型编码',
  type_name VARCHAR(64) NOT NULL COMMENT '字典类型名称',
  description VARCHAR(255) NULL COMMENT '字典描述',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1 启用，0 停用',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_dict_type_code (type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='字典类型';

CREATE TABLE dict_item (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  type_code VARCHAR(64) NOT NULL COMMENT '字典类型编码',
  item_code VARCHAR(64) NOT NULL COMMENT '字典项编码',
  item_label VARCHAR(64) NOT NULL COMMENT '展示标签',
  item_value VARCHAR(128) NOT NULL COMMENT '接口值',
  extra_json JSON NULL COMMENT '扩展元数据',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1 启用，0 停用',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_dict_item_type_code (type_code, item_code),
  KEY idx_qy_dict_item_type_enabled (type_code, enabled, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='字典项';

CREATE TABLE region (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  parent_id BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '父区域编号，根区域为 0',
  region_code VARCHAR(32) NOT NULL COMMENT '区域编码',
  region_name VARCHAR(80) NOT NULL COMMENT '区域名称',
  leader_user_id BIGINT UNSIGNED NULL COMMENT '区域负责人统一用户编号',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  status VARCHAR(32) NOT NULL DEFAULT 'ENABLED' COMMENT '启用/停用',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_region_code (region_code),
  KEY idx_qy_region_parent_status (parent_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='运营区域';

CREATE TABLE store (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  region_id BIGINT UNSIGNED NULL COMMENT '所属运营区域编号',
  store_code VARCHAR(32) NOT NULL COMMENT '门店编码',
  store_name VARCHAR(80) NOT NULL COMMENT '门店名称',
  cover_url VARCHAR(512) NULL COMMENT '门店封面图片',
  phone VARCHAR(32) NULL COMMENT '门店电话',
  province VARCHAR(32) NULL COMMENT '省份',
  city VARCHAR(32) NULL COMMENT '城市',
  district VARCHAR(32) NULL COMMENT '行政区',
  address VARCHAR(255) NOT NULL COMMENT '地址',
  longitude DECIMAL(10, 7) NULL COMMENT '经度',
  latitude DECIMAL(10, 7) NULL COMMENT '纬度',
  business_hours VARCHAR(64) NOT NULL COMMENT '营业时间展示文本',
  open_time TIME NOT NULL COMMENT '每日开店时间',
  close_time TIME NOT NULL COMMENT '每日闭店时间',
  business_status VARCHAR(32) NOT NULL DEFAULT 'OPEN' COMMENT '营业/闭店',
  rating DECIMAL(2, 1) NOT NULL DEFAULT 5.0 COMMENT '展示评分',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1 启用，0 停用',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_store_code (store_code),
  KEY idx_qy_store_region_status (region_id, enabled),
  KEY idx_qy_store_city_status (city, business_status, enabled),
  KEY idx_qy_store_geo (longitude, latitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='统一品牌门店';

CREATE TABLE store_gallery (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  image_url VARCHAR(512) NOT NULL COMMENT '图片地址',
  image_title VARCHAR(80) NULL COMMENT '图片标题',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_qy_store_gallery_store (store_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='门店相册';

CREATE TABLE store_facility (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  facility_name VARCHAR(64) NOT NULL COMMENT '设施名称',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_qy_store_facility_store (store_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='门店设施';

CREATE TABLE store_business_day (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  business_date DATE NOT NULL COMMENT '营业日期',
  open_time TIME NULL COMMENT '特殊开店时间',
  close_time TIME NULL COMMENT '特殊闭店时间',
  day_status VARCHAR(32) NOT NULL DEFAULT 'OPEN' COMMENT '营业/闭店/暂停营业',
  reason VARCHAR(255) NULL COMMENT '后端接口需要时展示的原因',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_store_business_day (store_id, business_date),
  KEY idx_qy_store_business_day_status (business_date, day_status),
  CONSTRAINT chk_qy_store_business_day_time CHECK (
    (day_status <> 'OPEN') OR (open_time IS NOT NULL AND close_time IS NOT NULL AND open_time < close_time)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='门店特殊营业日';

CREATE TABLE sys_user (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_type VARCHAR(32) NOT NULL COMMENT '用户类型：CUSTOMER/STAFF',
  display_name VARCHAR(64) NOT NULL COMMENT '展示名称',
  avatar_url VARCHAR(512) NULL COMMENT '头像地址',
  status VARCHAR(32) NOT NULL DEFAULT 'ENABLED' COMMENT '启用/停用',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_qy_sys_user_type_status (user_type, status),
  CONSTRAINT chk_qy_sys_user_type CHECK (user_type IN ('CUSTOMER', 'STAFF'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='统一用户主体';

CREATE TABLE sys_dept (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  parent_id BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '父部门编号，根部门为 0',
  dept_code VARCHAR(32) NOT NULL COMMENT '部门编码',
  dept_name VARCHAR(80) NOT NULL COMMENT '部门名称',
  leader_user_id BIGINT UNSIGNED NULL COMMENT '部门负责人统一用户编号',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  status VARCHAR(32) NOT NULL DEFAULT 'ENABLED' COMMENT '启用/停用',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_sys_dept_code (dept_code),
  KEY idx_qy_sys_dept_parent_status (parent_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统部门';

CREATE TABLE sys_user_dept (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '统一用户编号',
  dept_id BIGINT UNSIGNED NOT NULL COMMENT '部门编号',
  is_primary TINYINT NOT NULL DEFAULT 0 COMMENT '1 主归属，0 兼职归属',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_sys_user_dept (user_id, dept_id),
  KEY idx_qy_sys_user_dept_dept (dept_id, is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户部门归属';

CREATE TABLE sys_user_identity (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '统一用户编号',
  identity_type VARCHAR(32) NOT NULL COMMENT '身份类型：MOBILE/PASSWORD/OPEN_ID/UNION_ID',
  identifier VARCHAR(128) NOT NULL COMMENT '登录标识',
  credential_hash VARCHAR(255) NULL COMMENT '认证凭据哈希值',
  verified TINYINT NOT NULL DEFAULT 1 COMMENT '1 已验证，0 未验证',
  last_login_at DATETIME NULL COMMENT '最近登录时间',
  status VARCHAR(32) NOT NULL DEFAULT 'ENABLED' COMMENT '启用/停用',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_sys_user_identity (identity_type, identifier),
  KEY idx_qy_sys_user_identity_user (user_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='统一用户登录身份';

CREATE TABLE sys_session (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '统一用户编号',
  token_hash VARCHAR(128) NOT NULL COMMENT '访问令牌哈希值',
  client_type VARCHAR(32) NOT NULL COMMENT '客户端类型：MINI_PROGRAM/ADMIN_WEB',
  expires_at DATETIME NOT NULL COMMENT '过期时间',
  last_seen_at DATETIME NULL COMMENT '最近访问时间',
  revoked_at DATETIME NULL COMMENT '注销时间',
  login_ip VARCHAR(64) NULL COMMENT '登录 IP 地址',
  user_agent VARCHAR(512) NULL COMMENT '登录客户端信息',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_sys_session_token (token_hash),
  KEY idx_qy_sys_session_user_expire (user_id, expires_at),
  KEY idx_qy_sys_session_expire (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='统一登录会话';

CREATE TABLE sys_role (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  role_code VARCHAR(64) NOT NULL COMMENT '角色编码',
  role_name VARCHAR(64) NOT NULL COMMENT '角色名称',
  description VARCHAR(255) NULL COMMENT '角色描述',
  status VARCHAR(32) NOT NULL DEFAULT 'ENABLED' COMMENT '启用/停用',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_sys_role_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='统一角色';

CREATE TABLE sys_permission (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  permission_code VARCHAR(128) NOT NULL COMMENT '权限编码',
  permission_name VARCHAR(80) NOT NULL COMMENT '权限名称',
  resource_code VARCHAR(64) NOT NULL COMMENT '资源编码',
  action_code VARCHAR(32) NOT NULL COMMENT '操作编码：READ/CREATE/UPDATE/DELETE/EXPORT',
  resource_path VARCHAR(255) NULL COMMENT '菜单或接口路径',
  status VARCHAR(32) NOT NULL DEFAULT 'ENABLED' COMMENT '启用/停用',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_sys_permission_code (permission_code),
  KEY idx_qy_sys_permission_resource_action (resource_code, action_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='统一权限';

CREATE TABLE sys_menu (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  parent_id BIGINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '父菜单编号，根菜单为 0',
  menu_code VARCHAR(64) NOT NULL COMMENT '菜单编码',
  menu_name VARCHAR(80) NOT NULL COMMENT '菜单名称',
  menu_type VARCHAR(32) NOT NULL COMMENT '目录/菜单/按钮',
  route_path VARCHAR(255) NULL COMMENT '前端路由地址',
  permission_code VARCHAR(128) NULL COMMENT '关联权限编码',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  status VARCHAR(32) NOT NULL DEFAULT 'ENABLED' COMMENT '启用/停用',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_sys_menu_code (menu_code),
  KEY idx_qy_sys_menu_parent_sort (parent_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='系统菜单';

CREATE TABLE sys_user_role (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '统一用户编号',
  role_id BIGINT UNSIGNED NOT NULL COMMENT '角色编号',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_sys_user_role (user_id, role_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户角色关系';

CREATE TABLE sys_role_permission (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  role_id BIGINT UNSIGNED NOT NULL COMMENT '角色编号',
  permission_id BIGINT UNSIGNED NOT NULL COMMENT '权限编号',
  effect VARCHAR(16) NOT NULL DEFAULT 'ALLOW' COMMENT '允许/拒绝',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_sys_role_permission (role_id, permission_id),
  CONSTRAINT chk_qy_sys_role_permission_effect CHECK (effect IN ('ALLOW', 'DENY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色权限关系';

CREATE TABLE sys_user_permission (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '统一用户编号',
  permission_id BIGINT UNSIGNED NOT NULL COMMENT '权限编号',
  effect VARCHAR(16) NOT NULL DEFAULT 'ALLOW' COMMENT '允许/拒绝',
  valid_from DATETIME NULL COMMENT '授权生效时间',
  valid_until DATETIME NULL COMMENT '授权失效时间',
  created_by_user_id BIGINT UNSIGNED NULL COMMENT '授权操作人统一用户编号',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_qy_sys_user_permission_lookup (user_id, permission_id, valid_from, valid_until),
  CONSTRAINT chk_qy_sys_user_permission_effect CHECK (effect IN ('ALLOW', 'DENY')),
  CONSTRAINT chk_qy_sys_user_permission_validity CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_from < valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户直接权限授权';

CREATE TABLE sys_role_menu (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  role_id BIGINT UNSIGNED NOT NULL COMMENT '角色编号',
  menu_id BIGINT UNSIGNED NOT NULL COMMENT '菜单编号',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_sys_role_menu (role_id, menu_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色菜单关系';

CREATE TABLE sys_role_data_scope (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  role_id BIGINT UNSIGNED NOT NULL COMMENT '角色编号',
  resource_code VARCHAR(64) NOT NULL COMMENT '资源编码',
  action_code VARCHAR(32) NOT NULL COMMENT '操作编码',
  scope_type VARCHAR(32) NOT NULL COMMENT '数据范围：NONE/SELF/PRIMARY_STORE/ASSIGNED_STORES/REGION_STORES/ALL_STORES',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_sys_role_data_scope (role_id, resource_code, action_code),
  CONSTRAINT chk_qy_sys_role_data_scope_type CHECK (scope_type IN ('NONE', 'SELF', 'PRIMARY_STORE', 'ASSIGNED_STORES', 'REGION_STORES', 'ALL_STORES'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色资源操作数据范围';

CREATE TABLE sys_role_scope_store (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  role_id BIGINT UNSIGNED NOT NULL COMMENT '角色编号',
  resource_code VARCHAR(64) NOT NULL COMMENT '资源编码',
  action_code VARCHAR(32) NOT NULL COMMENT '操作编码',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '授权门店编号',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_sys_role_scope_store (role_id, resource_code, action_code, store_id),
  KEY idx_qy_sys_role_scope_store_store (store_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色数据范围门店授权';

CREATE TABLE sys_role_scope_region (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  role_id BIGINT UNSIGNED NOT NULL COMMENT '角色编号',
  resource_code VARCHAR(64) NOT NULL COMMENT '资源编码',
  action_code VARCHAR(32) NOT NULL COMMENT '操作编码',
  region_id BIGINT UNSIGNED NOT NULL COMMENT '授权区域编号',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_sys_role_scope_region (role_id, resource_code, action_code, region_id),
  KEY idx_qy_sys_role_scope_region_region (region_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='角色数据范围区域授权';

CREATE TABLE sys_user_data_scope (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '统一用户编号',
  resource_code VARCHAR(64) NOT NULL COMMENT '资源编码',
  action_code VARCHAR(32) NOT NULL COMMENT '操作编码',
  scope_type VARCHAR(32) NOT NULL COMMENT '数据范围：NONE/SELF/PRIMARY_STORE/ASSIGNED_STORES/REGION_STORES/ALL_STORES',
  valid_from DATETIME NULL COMMENT '授权生效时间',
  valid_until DATETIME NULL COMMENT '授权失效时间',
  created_by_user_id BIGINT UNSIGNED NULL COMMENT '授权操作人统一用户编号',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_qy_sys_user_data_scope_lookup (user_id, resource_code, action_code, valid_from, valid_until),
  CONSTRAINT chk_qy_sys_user_data_scope_type CHECK (scope_type IN ('NONE', 'SELF', 'PRIMARY_STORE', 'ASSIGNED_STORES', 'REGION_STORES', 'ALL_STORES')),
  CONSTRAINT chk_qy_sys_user_data_scope_validity CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_from < valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户资源操作数据范围覆盖';

CREATE TABLE sys_user_scope_store (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '统一用户编号',
  resource_code VARCHAR(64) NOT NULL COMMENT '资源编码',
  action_code VARCHAR(32) NOT NULL COMMENT '操作编码',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '授权门店编号',
  valid_from DATETIME NULL COMMENT '授权生效时间',
  valid_until DATETIME NULL COMMENT '授权失效时间',
  created_by_user_id BIGINT UNSIGNED NULL COMMENT '授权操作人统一用户编号',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_qy_sys_user_scope_store_lookup (user_id, resource_code, action_code, valid_from, valid_until),
  KEY idx_qy_sys_user_scope_store_store (store_id),
  CONSTRAINT chk_qy_sys_user_scope_store_validity CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_from < valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户数据范围门店覆盖';

CREATE TABLE sys_user_scope_region (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '统一用户编号',
  resource_code VARCHAR(64) NOT NULL COMMENT '资源编码',
  action_code VARCHAR(32) NOT NULL COMMENT '操作编码',
  region_id BIGINT UNSIGNED NOT NULL COMMENT '授权区域编号',
  valid_from DATETIME NULL COMMENT '授权生效时间',
  valid_until DATETIME NULL COMMENT '授权失效时间',
  created_by_user_id BIGINT UNSIGNED NULL COMMENT '授权操作人统一用户编号',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_qy_sys_user_scope_region_lookup (user_id, resource_code, action_code, valid_from, valid_until),
  KEY idx_qy_sys_user_scope_region_region (region_id),
  CONSTRAINT chk_qy_sys_user_scope_region_validity CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_from < valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户数据范围区域覆盖';

CREATE TABLE staff (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '统一用户编号',
  employee_no VARCHAR(32) NOT NULL COMMENT '员工编号',
  primary_store_id BIGINT UNSIGNED NULL COMMENT '主门店编号',
  position_name VARCHAR(64) NULL COMMENT '岗位名称',
  mobile VARCHAR(32) NULL COMMENT '工作手机号',
  status VARCHAR(32) NOT NULL DEFAULT 'ENABLED' COMMENT '启用/停用',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_staff_user (user_id),
  UNIQUE KEY uk_qy_staff_employee_no (employee_no),
  KEY idx_qy_staff_store_status (primary_store_id, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='员工业务资料';

CREATE TABLE customer (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '统一用户编号',
  mobile VARCHAR(32) NOT NULL COMMENT '手机号',
  nickname VARCHAR(80) NULL COMMENT '昵称',
  avatar_url VARCHAR(512) NULL COMMENT '头像地址',
  gender VARCHAR(16) NULL COMMENT '性别字典值',
  birthday DATE NULL COMMENT '出生日期',
  member_level VARCHAR(32) NOT NULL DEFAULT 'REGULAR' COMMENT '会员等级字典值',
  last_visit_at DATETIME NULL COMMENT '最近到店时间',
  status VARCHAR(32) NOT NULL DEFAULT 'ENABLED' COMMENT '启用/停用',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_customer_user (user_id),
  UNIQUE KEY uk_qy_customer_mobile (mobile),
  KEY idx_qy_customer_member_level (member_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='客户';

CREATE TABLE customer_contact (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户编号',
  contact_name VARCHAR(64) NOT NULL COMMENT '联系人姓名',
  mobile VARCHAR(32) NOT NULL COMMENT '联系人手机号',
  is_default TINYINT NOT NULL DEFAULT 0 COMMENT '1 默认，0 普通',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_qy_customer_contact_customer (customer_id, is_default)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='客户联系人';

CREATE TABLE customer_favorite_store (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户编号',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  visit_count INT NOT NULL DEFAULT 0 COMMENT '历史到店次数',
  last_booking_at DATETIME NULL COMMENT '最近预约时间',
  is_pinned TINYINT NOT NULL DEFAULT 0 COMMENT '1 置顶为常去门店',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '常去门店中的排序顺序',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_customer_favorite_store (customer_id, store_id),
  KEY idx_qy_customer_favorite_order (customer_id, is_pinned, sort_order, last_booking_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='客户常去门店';

CREATE TABLE customer_store_relation (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户编号',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  first_booking_at DATETIME NULL COMMENT '首次预约时间',
  last_booking_at DATETIME NULL COMMENT '最近预约或消费时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_customer_store_relation (customer_id, store_id),
  KEY idx_qy_customer_store_relation_store (store_id, last_booking_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='客户门店业务关系';

CREATE TABLE service_category (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  category_code VARCHAR(32) NOT NULL COMMENT '分类编码',
  category_name VARCHAR(64) NOT NULL COMMENT '分类名称',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1 启用，0 停用',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_service_category_code (category_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='服务分类';

CREATE TABLE service_item (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  service_code VARCHAR(32) NOT NULL COMMENT '服务项目编码',
  category_id BIGINT UNSIGNED NOT NULL COMMENT '服务分类编号',
  service_name VARCHAR(80) NOT NULL COMMENT '服务项目名称',
  cover_url VARCHAR(512) NULL COMMENT '封面图片地址',
  duration_minutes INT NOT NULL COMMENT '服务时长（分钟）',
  preparation_minutes INT NOT NULL DEFAULT 10 COMMENT '服务前准备分钟数',
  cleanup_minutes INT NOT NULL DEFAULT 10 COMMENT '服务后清洁分钟数',
  price_amount DECIMAL(10, 2) NOT NULL COMMENT '标准价格',
  member_price_amount DECIMAL(10, 2) NOT NULL COMMENT '会员价格',
  description TEXT NULL COMMENT '描述',
  service_steps TEXT NULL COMMENT '服务步骤',
  suitable_people TEXT NULL COMMENT '适合人群',
  notices TEXT NULL COMMENT '注意事项',
  sales_count INT NOT NULL DEFAULT 0 COMMENT '展示销量',
  status VARCHAR(32) NOT NULL DEFAULT 'ON_SHELF' COMMENT '上架/下架',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_service_item_code (service_code),
  KEY idx_qy_service_item_category_status (category_id, status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='服务项目';

CREATE TABLE service_item_tag (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT '服务项目编号',
  tag_name VARCHAR(32) NOT NULL COMMENT '展示标签名称',
  tag_type VARCHAR(32) NOT NULL DEFAULT 'FEATURE' COMMENT '特色/人群/促销',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_qy_service_item_tag_service (service_item_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='服务项目展示标签';

CREATE TABLE store_service (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT '服务项目编号',
  store_price_amount DECIMAL(10, 2) NULL COMMENT '可选的门店展示价格覆盖值',
  store_member_price_amount DECIMAL(10, 2) NULL COMMENT '可选的门店会员价格覆盖值',
  status VARCHAR(32) NOT NULL DEFAULT 'ON_SHELF' COMMENT '上架/下架',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '门店内排序顺序',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_store_service (store_id, service_item_id),
  KEY idx_qy_store_service_query (store_id, status, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='门店可用服务项目';

CREATE TABLE room (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  room_code VARCHAR(32) NOT NULL COMMENT '房间编码',
  room_name VARCHAR(64) NOT NULL COMMENT '房间名称',
  room_kind VARCHAR(32) NOT NULL COMMENT '房间类型字典值',
  capacity INT NOT NULL DEFAULT 1 COMMENT '接待容量',
  status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE' COMMENT '房间状态',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1 启用，0 停用',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_room_store_code (store_id, room_code),
  KEY idx_qy_room_store_status (store_id, status, enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='门店房间';

CREATE TABLE therapist (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  staff_id BIGINT UNSIGNED NULL COMMENT '关联员工资料编号',
  therapist_code VARCHAR(32) NOT NULL COMMENT '技师编码',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '主门店编号',
  therapist_name VARCHAR(64) NOT NULL COMMENT '技师姓名',
  avatar_url VARCHAR(512) NULL COMMENT '头像地址',
  portrait_url VARCHAR(512) NULL COMMENT '头像地址',
  level_name VARCHAR(64) NOT NULL COMMENT '技师等级',
  experience_years INT NOT NULL DEFAULT 0 COMMENT '从业年限',
  rating DECIMAL(2, 1) NOT NULL DEFAULT 5.0 COMMENT '展示评分',
  service_count INT NOT NULL DEFAULT 0 COMMENT '服务数量',
  specify_fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '指定技师附加费',
  status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE' COMMENT '技师状态',
  introduction TEXT NULL COMMENT '介绍',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1 启用，0 停用',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_therapist_staff (staff_id),
  UNIQUE KEY uk_qy_therapist_code (therapist_code),
  KEY idx_qy_therapist_store_status (store_id, status, enabled)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='技师';

CREATE TABLE therapist_skill (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  therapist_id BIGINT UNSIGNED NOT NULL COMMENT '技师编号',
  skill_name VARCHAR(64) NOT NULL COMMENT '技能名称',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_qy_therapist_skill_therapist (therapist_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='技师技能';

CREATE TABLE therapist_service (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  therapist_id BIGINT UNSIGNED NOT NULL COMMENT '技师编号',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT '服务项目编号',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1 启用，0 停用',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_therapist_service (therapist_id, service_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='技师服务能力';

CREATE TABLE therapist_schedule (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  therapist_id BIGINT UNSIGNED NOT NULL COMMENT '技师编号',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  work_date DATE NOT NULL COMMENT '工作日期',
  start_time TIME NOT NULL COMMENT '开始时间',
  end_time TIME NOT NULL COMMENT '结束时间',
  schedule_status VARCHAR(32) NOT NULL DEFAULT 'WORK' COMMENT '上班/休息/请假',
  remark VARCHAR(255) NULL COMMENT '备注',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_qy_therapist_schedule_therapist_date (therapist_id, work_date, start_time),
  KEY idx_qy_therapist_schedule_store_date (store_id, work_date),
  CONSTRAINT chk_qy_therapist_schedule_time CHECK (start_time < end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='技师排班';

CREATE TABLE therapist_leave (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  therapist_id BIGINT UNSIGNED NOT NULL COMMENT '技师编号',
  leave_start_at DATETIME NOT NULL COMMENT '请假开始时间',
  leave_end_at DATETIME NOT NULL COMMENT '请假结束时间',
  reason VARCHAR(255) NULL COMMENT '原因',
  approval_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED' COMMENT '审批状态',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  KEY idx_qy_therapist_leave_time (therapist_id, leave_start_at, leave_end_at),
  CONSTRAINT chk_qy_therapist_leave_time CHECK (leave_start_at < leave_end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='技师请假';

CREATE TABLE time_slot_snapshot (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT '服务项目编号',
  therapist_id BIGINT UNSIGNED NULL COMMENT '指定技师时的技师编号',
  slot_date DATE NOT NULL COMMENT '时段日期',
  start_time TIME NOT NULL COMMENT '时段开始时间',
  end_time TIME NOT NULL COMMENT '时段结束时间',
  period VARCHAR(32) NOT NULL COMMENT '上午/下午/晚间',
  status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE' COMMENT '时间槽状态',
  remaining_capacity INT NOT NULL DEFAULT 1 COMMENT '剩余容量',
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',
  PRIMARY KEY (id),
  KEY idx_qy_time_slot_query (store_id, service_item_id, slot_date, period, status),
  KEY idx_qy_time_slot_therapist (therapist_id, slot_date, start_time),
  CONSTRAINT chk_qy_time_slot_time CHECK (start_time < end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='可预约时间槽快照';

CREATE TABLE booking (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  booking_no VARCHAR(32) NOT NULL COMMENT '预约编号',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户编号',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT '服务项目编号',
  therapist_mode VARCHAR(32) NOT NULL DEFAULT 'SPECIFIED' COMMENT '指定/自动',
  therapist_id BIGINT UNSIGNED NULL COMMENT '技师编号',
  room_id BIGINT UNSIGNED NULL COMMENT '房间编号',
  scheduled_start_at DATETIME NOT NULL COMMENT '预约开始时间',
  scheduled_end_at DATETIME NOT NULL COMMENT '预约结束时间',
  occupied_start_at DATETIME NOT NULL COMMENT '包含准备时间的资源占用开始时间',
  occupied_end_at DATETIME NOT NULL COMMENT '包含清洁时间的资源占用结束时间',
  guest_count INT NOT NULL DEFAULT 1 COMMENT '客人数',
  contact_name VARCHAR(64) NOT NULL COMMENT '联系人姓名',
  contact_mobile VARCHAR(32) NOT NULL COMMENT '联系人手机号',
  remark VARCHAR(500) NULL COMMENT '客户备注',
  booking_source VARCHAR(32) NOT NULL DEFAULT 'MINI_PROGRAM' COMMENT '小程序/后台',
  status VARCHAR(32) NOT NULL COMMENT '预约状态',
  item_amount DECIMAL(10, 2) NOT NULL COMMENT '服务项目金额',
  therapist_fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '指定技师服务费',
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '优惠金额',
  balance_deduction_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '余额抵扣金额',
  deposit_due_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '应付订金金额',
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '已支付金额',
  cancelled_at DATETIME NULL COMMENT '取消时间',
  cancel_reason VARCHAR(255) NULL COMMENT '取消原因',
  request_id VARCHAR(64) NULL COMMENT '幂等请求编号',
  created_by_user_id BIGINT UNSIGNED NULL COMMENT '创建预约的统一用户编号',
  assigned_user_id BIGINT UNSIGNED NULL COMMENT '负责该预约的员工用户编号',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_booking_no (booking_no),
  UNIQUE KEY uk_qy_booking_request (request_id),
  KEY idx_qy_booking_customer_time (customer_id, scheduled_start_at),
  KEY idx_qy_booking_store_status_time (store_id, status, scheduled_start_at),
  KEY idx_qy_booking_therapist_occupied (therapist_id, occupied_start_at, occupied_end_at),
  KEY idx_qy_booking_assigned_user_time (assigned_user_id, scheduled_start_at),
  KEY idx_qy_booking_created_user_time (created_by_user_id, scheduled_start_at),
  KEY idx_qy_booking_room_occupied (room_id, occupied_start_at, occupied_end_at),
  CONSTRAINT chk_qy_booking_schedule_time CHECK (scheduled_start_at < scheduled_end_at),
  CONSTRAINT chk_qy_booking_occupied_time CHECK (occupied_start_at <= scheduled_start_at AND scheduled_end_at <= occupied_end_at),
  CONSTRAINT chk_qy_booking_guest_count CHECK (guest_count > 0),
  CONSTRAINT chk_qy_booking_status CHECK (
    status IN (
      'PENDING_PAYMENT',
      'BOOKED',
      'CHECKED_IN',
      'WAITING_SERVICE',
      'IN_SERVICE',
      'PENDING_SETTLEMENT',
      'COMPLETED',
      'CANCELLED'
    )
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='预约';

CREATE TABLE booking_status_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  booking_id BIGINT UNSIGNED NOT NULL COMMENT '预约编号',
  from_status VARCHAR(32) NULL COMMENT '原状态',
  to_status VARCHAR(32) NOT NULL COMMENT '目标状态',
  operation VARCHAR(64) NOT NULL COMMENT '操作',
  operator_type VARCHAR(32) NOT NULL COMMENT '客户/后台/系统',
  operator_id BIGINT UNSIGNED NULL COMMENT '操作员编号',
  remark VARCHAR(255) NULL COMMENT '备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_qy_booking_status_log_booking (booking_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='预约状态日志';

CREATE TABLE audit_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  operator_user_id BIGINT UNSIGNED NULL COMMENT '操作人统一用户编号',
  action_code VARCHAR(128) NOT NULL COMMENT '操作权限编码',
  resource_type VARCHAR(64) NOT NULL COMMENT '资源类型',
  resource_id VARCHAR(64) NOT NULL COMMENT '资源标识',
  store_id BIGINT UNSIGNED NULL COMMENT '关联门店编号',
  before_data JSON NULL COMMENT '变更前摘要',
  after_data JSON NULL COMMENT '变更后摘要',
  request_id VARCHAR(64) NULL COMMENT '请求追踪编号',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_qy_audit_log_resource (resource_type, resource_id, created_at),
  KEY idx_qy_audit_log_operator_time (operator_user_id, created_at),
  KEY idx_qy_audit_log_store_time (store_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='敏感操作审计日志';

CREATE TABLE checkin_record (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  booking_id BIGINT UNSIGNED NOT NULL COMMENT '预约编号',
  checkin_code VARCHAR(16) NOT NULL COMMENT '签到核销码',
  qr_payload VARCHAR(512) NULL COMMENT '二维码载荷',
  checked_in_at DATETIME NULL COMMENT '签到时间',
  checkin_status VARCHAR(32) NOT NULL DEFAULT 'WAITING' COMMENT '待签到/已签到/已过期',
  operator_user_id BIGINT UNSIGNED NULL COMMENT '执行签到操作的统一用户编号',
  request_id VARCHAR(64) NULL COMMENT '幂等请求编号',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_checkin_record_booking (booking_id),
  UNIQUE KEY uk_qy_checkin_record_request (request_id),
  KEY idx_qy_checkin_record_code (checkin_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='签到记录';

CREATE TABLE service_order (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  service_order_no VARCHAR(32) NOT NULL COMMENT '服务订单编号',
  booking_id BIGINT UNSIGNED NOT NULL COMMENT '预约编号',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户编号',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT '服务项目编号',
  therapist_id BIGINT UNSIGNED NULL COMMENT '技师编号',
  assigned_user_id BIGINT UNSIGNED NULL COMMENT '负责该服务订单的员工用户编号',
  room_id BIGINT UNSIGNED NULL COMMENT '房间编号',
  status VARCHAR(32) NOT NULL COMMENT '服务订单状态',
  started_at DATETIME NULL COMMENT '服务开始时间',
  finished_at DATETIME NULL COMMENT '服务完成时间',
  settlement_at DATETIME NULL COMMENT '结算时间',
  payable_amount DECIMAL(10, 2) NOT NULL COMMENT '应付金额',
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '已支付金额',
  operator_user_id BIGINT UNSIGNED NULL COMMENT '最近操作该订单的统一用户编号',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_service_order_no (service_order_no),
  UNIQUE KEY uk_qy_service_order_booking (booking_id),
  KEY idx_qy_service_order_store_status (store_id, status, created_at),
  KEY idx_qy_service_order_therapist_status (therapist_id, status, created_at),
  KEY idx_qy_service_order_assigned_user_status (assigned_user_id, status, created_at),
  KEY idx_qy_service_order_room_status (room_id, status, created_at),
  CONSTRAINT chk_qy_service_order_status CHECK (
    status IN (
      'PENDING_PAYMENT',
      'BOOKED',
      'CHECKED_IN',
      'WAITING_SERVICE',
      'IN_SERVICE',
      'PENDING_SETTLEMENT',
      'COMPLETED',
      'CANCELLED'
    )
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='服务订单';

CREATE TABLE resource_occupation (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  resource_type VARCHAR(32) NOT NULL COMMENT '技师/房间',
  resource_id BIGINT UNSIGNED NOT NULL COMMENT '技师编号或房间编号',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  booking_id BIGINT UNSIGNED NULL COMMENT '预约编号',
  service_order_id BIGINT UNSIGNED NULL COMMENT '服务订单编号',
  occupied_start_at DATETIME NOT NULL COMMENT '包含准备时间的占用开始时间',
  occupied_end_at DATETIME NOT NULL COMMENT '包含清洁时间的占用结束时间',
  occupation_status VARCHAR(32) NOT NULL DEFAULT 'HELD' COMMENT '锁定/占用/已释放/已取消',
  occupation_reason VARCHAR(32) NOT NULL DEFAULT 'BOOKING' COMMENT '预约/服务/清洁/维护',
  request_id VARCHAR(64) NULL COMMENT '幂等请求编号',
  released_at DATETIME NULL COMMENT '释放时间',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_resource_occupation_request (request_id),
  KEY idx_qy_resource_occupation_conflict (resource_type, resource_id, occupation_status, occupied_start_at, occupied_end_at),
  KEY idx_qy_resource_occupation_store_time (store_id, occupied_start_at, occupied_end_at),
  KEY idx_qy_resource_occupation_booking (booking_id),
  CONSTRAINT chk_qy_resource_occupation_time CHECK (occupied_start_at < occupied_end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用于技师和房间冲突校验的资源占用';

CREATE TABLE service_order_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  service_order_id BIGINT UNSIGNED NOT NULL COMMENT '服务订单编号',
  from_status VARCHAR(32) NULL COMMENT '原状态',
  to_status VARCHAR(32) NOT NULL COMMENT '目标状态',
  operation VARCHAR(64) NOT NULL COMMENT '操作',
  operator_id BIGINT UNSIGNED NULL COMMENT '后台操作员编号',
  remark VARCHAR(255) NULL COMMENT '备注',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_qy_service_order_log_order (service_order_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='服务订单状态日志';

CREATE TABLE payment_order (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  payment_no VARCHAR(32) NOT NULL COMMENT '支付单号',
  booking_id BIGINT UNSIGNED NULL COMMENT '预约编号',
  service_order_id BIGINT UNSIGNED NULL COMMENT '服务订单编号',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户编号',
  payment_purpose VARCHAR(32) NOT NULL COMMENT '订金/余额/退款',
  payment_channel VARCHAR(32) NOT NULL DEFAULT 'MANUAL' COMMENT '支付渠道',
  payment_status VARCHAR(32) NOT NULL COMMENT '支付状态',
  payable_amount DECIMAL(10, 2) NOT NULL COMMENT '应付金额',
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '已支付金额',
  paid_at DATETIME NULL COMMENT '支付时间',
  external_trade_no VARCHAR(128) NULL COMMENT '第三方交易单号',
  refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '退款金额',
  refunded_at DATETIME NULL COMMENT '退款时间',
  request_id VARCHAR(64) NULL COMMENT '幂等请求编号',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_payment_no (payment_no),
  UNIQUE KEY uk_qy_payment_request (request_id),
  KEY idx_qy_payment_booking (booking_id),
  KEY idx_qy_payment_customer_status (customer_id, payment_status, created_at),
  CONSTRAINT chk_qy_payment_order_amount CHECK (
    payable_amount >= 0 AND paid_amount >= 0 AND refund_amount >= 0
  ),
  CONSTRAINT chk_qy_payment_order_status CHECK (
    payment_status IN ('UNPAID', 'DEPOSIT_PAID', 'PAID', 'REFUNDING', 'REFUNDED', 'CLOSED')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='支付订单';

CREATE TABLE refund_order (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  refund_no VARCHAR(32) NOT NULL COMMENT '退款单号',
  payment_order_id BIGINT UNSIGNED NOT NULL COMMENT '原支付单编号',
  booking_id BIGINT UNSIGNED NULL COMMENT '预约编号',
  service_order_id BIGINT UNSIGNED NULL COMMENT '服务订单编号',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户编号',
  refund_channel VARCHAR(32) NOT NULL DEFAULT 'MANUAL' COMMENT '退款渠道',
  refund_status VARCHAR(32) NOT NULL DEFAULT 'REFUNDING' COMMENT '退款中/已退款/失败/已关闭',
  refund_reason VARCHAR(255) NULL COMMENT '退款原因',
  refund_amount DECIMAL(10, 2) NOT NULL COMMENT '退款金额',
  external_refund_no VARCHAR(128) NULL COMMENT '第三方退款单号',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '申请退款时间',
  refunded_at DATETIME NULL COMMENT '退款完成时间',
  request_id VARCHAR(64) NULL COMMENT '幂等请求编号',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_refund_no (refund_no),
  UNIQUE KEY uk_qy_refund_request (request_id),
  KEY idx_qy_refund_payment (payment_order_id),
  KEY idx_qy_refund_customer_status (customer_id, refund_status, created_at),
  CONSTRAINT chk_qy_refund_amount CHECK (refund_amount > 0),
  CONSTRAINT chk_qy_refund_status CHECK (refund_status IN ('REFUNDING', 'REFUNDED', 'FAILED', 'CLOSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='为支付接入预留的退款订单';

CREATE TABLE store_daily_metrics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  stat_date DATE NOT NULL COMMENT '统计日期',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  booking_count INT NOT NULL DEFAULT 0 COMMENT '创建预约数量',
  completed_order_count INT NOT NULL DEFAULT 0 COMMENT '已完成服务订单数量',
  cancelled_booking_count INT NOT NULL DEFAULT 0 COMMENT '已取消预约数量',
  checked_in_count INT NOT NULL DEFAULT 0 COMMENT '已签到数量',
  gross_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '应付总金额',
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '已支付金额',
  refund_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '退款金额',
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '优惠金额',
  member_balance_consume_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '会员余额消费金额',
  package_usage_times INT NOT NULL DEFAULT 0 COMMENT '套餐使用次数',
  new_customer_count INT NOT NULL DEFAULT 0 COMMENT '新客数量',
  review_count INT NOT NULL DEFAULT 0 COMMENT '评价数量',
  average_rating DECIMAL(3, 2) NULL COMMENT '平均评价分数',
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_store_daily_metrics (stat_date, store_id),
  KEY idx_qy_store_daily_metrics_store_date (store_id, stat_date),
  CONSTRAINT chk_qy_store_daily_metrics_non_negative CHECK (
    booking_count >= 0 AND
    completed_order_count >= 0 AND
    cancelled_booking_count >= 0 AND
    checked_in_count >= 0 AND
    gross_amount >= 0 AND
    paid_amount >= 0 AND
    refund_amount >= 0 AND
    discount_amount >= 0 AND
    member_balance_consume_amount >= 0 AND
    package_usage_times >= 0 AND
    new_customer_count >= 0 AND
    review_count >= 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='门店日运营指标';

CREATE TABLE service_daily_metrics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  stat_date DATE NOT NULL COMMENT '统计日期',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT '服务项目编号',
  booking_count INT NOT NULL DEFAULT 0 COMMENT '创建预约数量',
  completed_order_count INT NOT NULL DEFAULT 0 COMMENT '已完成服务订单数量',
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '已支付金额',
  refund_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '退款金额',
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_service_daily_metrics (stat_date, store_id, service_item_id),
  KEY idx_qy_service_daily_metrics_service_date (service_item_id, stat_date),
  CONSTRAINT chk_qy_service_daily_metrics_non_negative CHECK (
    booking_count >= 0 AND
    completed_order_count >= 0 AND
    paid_amount >= 0 AND
    refund_amount >= 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='服务项目日运营指标';

CREATE TABLE therapist_daily_metrics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  stat_date DATE NOT NULL COMMENT '统计日期',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  therapist_id BIGINT UNSIGNED NOT NULL COMMENT '技师编号',
  scheduled_count INT NOT NULL DEFAULT 0 COMMENT '已排预约数量',
  completed_order_count INT NOT NULL DEFAULT 0 COMMENT '已完成服务订单数量',
  service_minutes INT NOT NULL DEFAULT 0 COMMENT '实际服务分钟数',
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT '已支付金额',
  review_count INT NOT NULL DEFAULT 0 COMMENT '评价数量',
  average_rating DECIMAL(3, 2) NULL COMMENT '平均评价分数',
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '生成时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_therapist_daily_metrics (stat_date, store_id, therapist_id),
  KEY idx_qy_therapist_daily_metrics_therapist_date (therapist_id, stat_date),
  CONSTRAINT chk_qy_therapist_daily_metrics_non_negative CHECK (
    scheduled_count >= 0 AND
    completed_order_count >= 0 AND
    service_minutes >= 0 AND
    paid_amount >= 0 AND
    review_count >= 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='技师日运营指标';

CREATE TABLE report_job_run (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  job_code VARCHAR(64) NOT NULL COMMENT '报表任务编码',
  stat_date DATE NOT NULL COMMENT '统计日期',
  run_status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS' COMMENT '成功/失败',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '开始服务时间',
  finished_at DATETIME NULL COMMENT '完成时间',
  error_message VARCHAR(500) NULL COMMENT '错误信息',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_qy_report_job_run_query (job_code, stat_date, started_at),
  CONSTRAINT chk_qy_report_job_run_status CHECK (run_status IN ('SUCCESS', 'FAILED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='报表生成任务执行日志';

CREATE TABLE member_account (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户编号',
  account_scope VARCHAR(32) NOT NULL DEFAULT 'ALL_STORES' COMMENT '统一品牌固定为全门店通用',
  balance_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '余额变动金额',
  total_recharge_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '累计充值金额',
  total_consume_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '累计消费金额',
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT '正常/冻结',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_member_account_customer (customer_id),
  CONSTRAINT chk_qy_member_account_scope CHECK (account_scope = 'ALL_STORES')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='全门店通用会员账户';

CREATE TABLE member_balance_transaction (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  account_id BIGINT UNSIGNED NOT NULL COMMENT '会员账户编号',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户编号',
  booking_id BIGINT UNSIGNED NULL COMMENT '预约编号',
  service_order_id BIGINT UNSIGNED NULL COMMENT '服务订单编号',
  transaction_no VARCHAR(32) NOT NULL COMMENT '余额流水单号',
  transaction_type VARCHAR(32) NOT NULL COMMENT '充值/消费/退款/调整',
  amount DECIMAL(10, 2) NOT NULL COMMENT '流水记账的正数金额',
  balance_after DECIMAL(10, 2) NOT NULL COMMENT '交易后余额',
  remark VARCHAR(255) NULL COMMENT '备注',
  request_id VARCHAR(64) NULL COMMENT '幂等请求编号',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_member_balance_transaction_no (transaction_no),
  UNIQUE KEY uk_qy_member_balance_transaction_request (request_id),
  KEY idx_qy_member_balance_transaction_customer (customer_id, created_at),
  CONSTRAINT chk_qy_member_balance_transaction_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='会员余额流水';

CREATE TABLE member_package_card (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户编号',
  card_no VARCHAR(32) NOT NULL COMMENT '套餐卡编号',
  package_name VARCHAR(80) NOT NULL COMMENT '套餐名称',
  package_scope VARCHAR(32) NOT NULL DEFAULT 'ALL_STORES' COMMENT '统一品牌固定为全门店通用',
  total_times INT NOT NULL COMMENT '总次数',
  remaining_times INT NOT NULL COMMENT '剩余次数',
  valid_start_date DATE NOT NULL COMMENT '有效期开始日期',
  valid_end_date DATE NOT NULL COMMENT '有效期结束日期',
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT '有效/已过期/已用完',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_member_package_card_no (card_no),
  KEY idx_qy_member_package_customer_status (customer_id, status),
  CONSTRAINT chk_qy_member_package_scope CHECK (package_scope = 'ALL_STORES')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='全门店通用会员套餐卡';

CREATE TABLE member_package_item (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  package_card_id BIGINT UNSIGNED NOT NULL COMMENT '套餐卡编号',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT '服务项目编号',
  total_times INT NOT NULL COMMENT '总次数',
  remaining_times INT NOT NULL COMMENT '剩余次数',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_member_package_item_service (package_card_id, service_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='会员套餐服务项目';

CREATE TABLE member_package_usage (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  package_card_id BIGINT UNSIGNED NOT NULL COMMENT '套餐卡编号',
  package_item_id BIGINT UNSIGNED NOT NULL COMMENT '套餐项目编号',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户编号',
  booking_id BIGINT UNSIGNED NULL COMMENT '预约编号',
  service_order_id BIGINT UNSIGNED NULL COMMENT '服务订单编号',
  used_times INT NOT NULL DEFAULT 1 COMMENT '已使用服务次数',
  remaining_times_after INT NOT NULL COMMENT '使用后的剩余次数',
  usage_status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED' COMMENT '已确认/已冲正',
  request_id VARCHAR(64) NULL COMMENT '幂等请求编号',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_member_package_usage_request (request_id),
  KEY idx_qy_member_package_usage_customer (customer_id, created_at),
  CONSTRAINT chk_qy_member_package_usage_times CHECK (used_times > 0 AND remaining_times_after >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='会员套餐使用记录';

CREATE TABLE coupon_template (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  coupon_code VARCHAR(32) NOT NULL COMMENT '优惠券模板编码',
  coupon_name VARCHAR(80) NOT NULL COMMENT '优惠券名称',
  coupon_scope VARCHAR(32) NOT NULL DEFAULT 'ALL_STORES' COMMENT '统一品牌固定为全门店通用',
  discount_type VARCHAR(32) NOT NULL COMMENT '固定金额/百分比',
  discount_amount DECIMAL(10, 2) NULL COMMENT '优惠金额',
  discount_percent DECIMAL(5, 2) NULL COMMENT '优惠比例',
  threshold_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT '门槛金额',
  valid_start_at DATETIME NOT NULL COMMENT '有效期开始时间',
  valid_end_at DATETIME NOT NULL COMMENT '有效期结束时间',
  issued_count INT NOT NULL DEFAULT 0 COMMENT '发放数量',
  used_count INT NOT NULL DEFAULT 0 COMMENT '已使用数量',
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT' COMMENT '草稿/生效/结束',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_by VARCHAR(64) NULL COMMENT '创建人',
  updated_by VARCHAR(64) NULL COMMENT '更新人',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_coupon_template_code (coupon_code),
  KEY idx_qy_coupon_template_status_time (status, valid_start_at, valid_end_at),
  CONSTRAINT chk_qy_coupon_template_scope CHECK (coupon_scope = 'ALL_STORES')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='全门店通用优惠券模板';

CREATE TABLE customer_coupon (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户编号',
  coupon_template_id BIGINT UNSIGNED NOT NULL COMMENT '优惠券模板编号',
  coupon_no VARCHAR(32) NOT NULL COMMENT '客户优惠券编号',
  status VARCHAR(32) NOT NULL DEFAULT 'UNUSED' COMMENT '未使用/已使用/已过期',
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '接收时间',
  used_at DATETIME NULL COMMENT '使用时间',
  valid_start_at DATETIME NOT NULL COMMENT '有效期开始时间',
  valid_end_at DATETIME NOT NULL COMMENT '有效期结束时间',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_customer_coupon_no (coupon_no),
  KEY idx_qy_customer_coupon_customer_status (customer_id, status, valid_end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='客户优惠券';

CREATE TABLE coupon_usage (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  customer_coupon_id BIGINT UNSIGNED NOT NULL COMMENT '客户优惠券编号',
  booking_id BIGINT UNSIGNED NULL COMMENT '预约编号',
  service_order_id BIGINT UNSIGNED NULL COMMENT '服务订单编号',
  discount_amount DECIMAL(10, 2) NOT NULL COMMENT '优惠金额',
  used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '使用时间',
  PRIMARY KEY (id),
  KEY idx_qy_coupon_usage_coupon (customer_coupon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='优惠券使用记录';

CREATE TABLE service_review (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  booking_id BIGINT UNSIGNED NOT NULL COMMENT '预约编号',
  service_order_id BIGINT UNSIGNED NULL COMMENT '服务订单编号',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT '客户编号',
  store_id BIGINT UNSIGNED NOT NULL COMMENT '门店编号',
  therapist_id BIGINT UNSIGNED NULL COMMENT '技师编号',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT '服务项目编号',
  therapist_rating TINYINT NOT NULL COMMENT '技师评分，1至5分',
  environment_rating TINYINT NOT NULL COMMENT '环境评分，1至5分',
  service_rating TINYINT NOT NULL COMMENT '服务评分，1至5分',
  tags VARCHAR(255) NULL COMMENT '逗号分隔的标签',
  content VARCHAR(600) NULL COMMENT '评价内容',
  anonymous TINYINT NOT NULL DEFAULT 1 COMMENT '1 匿名，0 公开',
  status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED' COMMENT '已发布/隐藏',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除标记',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_service_review_booking (booking_id),
  KEY idx_qy_service_review_store (store_id, created_at),
  KEY idx_qy_service_review_therapist (therapist_id, created_at),
  CONSTRAINT chk_qy_service_review_rating CHECK (
    therapist_rating BETWEEN 1 AND 5 AND
    environment_rating BETWEEN 1 AND 5 AND
    service_rating BETWEEN 1 AND 5
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='服务评价';

CREATE TABLE review_tag (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  review_id BIGINT UNSIGNED NOT NULL COMMENT '评价编号',
  tag_name VARCHAR(32) NOT NULL COMMENT '评价标签名称',
  tag_type VARCHAR(32) NOT NULL DEFAULT 'SATISFACTION' COMMENT '满意度/改进',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_qy_review_tag_review (review_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='评价标签';

CREATE TABLE review_image (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  review_id BIGINT UNSIGNED NOT NULL COMMENT '评价编号',
  image_url VARCHAR(512) NOT NULL COMMENT '图片地址',
  sort_order INT NOT NULL DEFAULT 0 COMMENT '排序序号',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_qy_review_image_review (review_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='评价图片';

INSERT INTO dict_type (type_code, type_name, description, sort_order) VALUES
('booking_status', '预约状态', '预约和服务订单统一状态', 10),
('payment_status', '支付状态', '支付与退款状态', 20),
('therapist_status', '技师状态', '技师可约和服务状态', 30),
('room_status', '房间状态', '房间占用状态', 40),
('time_slot_status', '时间槽状态', '客户端可约时间槽状态', 50),
('business_status', '营业状态', '门店营业状态', 60),
('coupon_status', '优惠券状态', '优惠券活动和客户券状态', 70),
('member_scope', '权益范围', '统一品牌权益范围', 80),
('sys_user_status', '统一用户状态', '统一登录用户状态', 90),
('schedule_status', '排班状态', '技师排班状态', 100),
('checkin_status', '签到状态', '到店签到状态', 110),
('resource_occupation_status', '资源占用状态', '技师和房间占用状态', 120),
('service_item_status', '服务项目状态', '服务项目上下架状态', 130),
('member_account_status', '会员账户状态', '会员账户和套餐状态', 140),
('review_status', '评价状态', '客户服务评价状态', 150),
('refund_status', '退款状态', '支付退款预留状态', 160),
('report_job_status', '报表任务状态', '运营报表生成任务状态', 170);

INSERT INTO dict_item (type_code, item_code, item_label, item_value, sort_order) VALUES
('booking_status', 'PENDING_PAYMENT', '待支付', 'PENDING_PAYMENT', 10),
('booking_status', 'BOOKED', '已预约', 'BOOKED', 20),
('booking_status', 'CHECKED_IN', '已签到', 'CHECKED_IN', 30),
('booking_status', 'WAITING_SERVICE', '待服务', 'WAITING_SERVICE', 40),
('booking_status', 'IN_SERVICE', '服务中', 'IN_SERVICE', 50),
('booking_status', 'PENDING_SETTLEMENT', '待结算', 'PENDING_SETTLEMENT', 60),
('booking_status', 'COMPLETED', '已完成', 'COMPLETED', 70),
('booking_status', 'CANCELLED', '已取消', 'CANCELLED', 80),
('payment_status', 'UNPAID', '待支付', 'UNPAID', 10),
('payment_status', 'DEPOSIT_PAID', '已付订金', 'DEPOSIT_PAID', 20),
('payment_status', 'PAID', '已支付', 'PAID', 30),
('payment_status', 'REFUNDING', '退款中', 'REFUNDING', 40),
('payment_status', 'REFUNDED', '已退款', 'REFUNDED', 50),
('payment_status', 'CLOSED', '已关闭', 'CLOSED', 60),
('therapist_status', 'AVAILABLE', '可预约', 'AVAILABLE', 10),
('therapist_status', 'BUSY', '服务中', 'BUSY', 20),
('therapist_status', 'OFF_DUTY', '休息', 'OFF_DUTY', 30),
('therapist_status', 'ON_LEAVE', '请假', 'ON_LEAVE', 40),
('room_status', 'AVAILABLE', '空闲', 'AVAILABLE', 10),
('room_status', 'BOOKED', '已预约', 'BOOKED', 20),
('room_status', 'IN_USE', '使用中', 'IN_USE', 30),
('room_status', 'CLEANING', '清洁中', 'CLEANING', 40),
('room_status', 'MAINTENANCE', '维护中', 'MAINTENANCE', 50),
('time_slot_status', 'AVAILABLE', '可预约', 'AVAILABLE', 10),
('time_slot_status', 'ALMOST_FULL', '即将约满', 'ALMOST_FULL', 20),
('time_slot_status', 'FULL', '已约满', 'FULL', 30),
('time_slot_status', 'CLOSED', '不可预约', 'CLOSED', 40),
('business_status', 'OPEN', '营业中', 'OPEN', 10),
('business_status', 'CLOSED', '休息中', 'CLOSED', 20),
('business_status', 'SUSPENDED', '暂停预约', 'SUSPENDED', 30),
('coupon_status', 'DRAFT', '草稿', 'DRAFT', 10),
('coupon_status', 'ACTIVE', '投放中', 'ACTIVE', 20),
('coupon_status', 'ENDED', '已结束', 'ENDED', 30),
('coupon_status', 'UNUSED', '未使用', 'UNUSED', 40),
('coupon_status', 'USED', '已使用', 'USED', 50),
('coupon_status', 'EXPIRED', '已过期', 'EXPIRED', 60),
('member_scope', 'ALL_STORES', '全门店通用', 'ALL_STORES', 10),
('sys_user_status', 'ENABLED', '启用', 'ENABLED', 10),
('sys_user_status', 'DISABLED', '禁用', 'DISABLED', 20),
('schedule_status', 'WORK', '上班', 'WORK', 10),
('schedule_status', 'REST', '休息', 'REST', 20),
('schedule_status', 'LEAVE', '请假', 'LEAVE', 30),
('checkin_status', 'WAITING', '待签到', 'WAITING', 10),
('checkin_status', 'CHECKED_IN', '已签到', 'CHECKED_IN', 20),
('checkin_status', 'EXPIRED', '已过期', 'EXPIRED', 30),
('resource_occupation_status', 'HELD', '已锁定', 'HELD', 10),
('resource_occupation_status', 'OCCUPIED', '占用中', 'OCCUPIED', 20),
('resource_occupation_status', 'RELEASED', '已释放', 'RELEASED', 30),
('resource_occupation_status', 'CANCELLED', '已取消', 'CANCELLED', 40),
('service_item_status', 'ON_SHELF', '上架', 'ON_SHELF', 10),
('service_item_status', 'OFF_SHELF', '下架', 'OFF_SHELF', 20),
('member_account_status', 'ACTIVE', '正常', 'ACTIVE', 10),
('member_account_status', 'FROZEN', '冻结', 'FROZEN', 20),
('member_account_status', 'EXPIRED', '已过期', 'EXPIRED', 30),
('member_account_status', 'USED_UP', '已用完', 'USED_UP', 40),
('review_status', 'PUBLISHED', '已发布', 'PUBLISHED', 10),
('review_status', 'HIDDEN', '已隐藏', 'HIDDEN', 20),
('refund_status', 'REFUNDING', '退款中', 'REFUNDING', 10),
('refund_status', 'REFUNDED', '已退款', 'REFUNDED', 20),
('refund_status', 'FAILED', '退款失败', 'FAILED', 30),
('refund_status', 'CLOSED', '已关闭', 'CLOSED', 40),
('report_job_status', 'SUCCESS', '成功', 'SUCCESS', 10),
('report_job_status', 'FAILED', '失败', 'FAILED', 20);
