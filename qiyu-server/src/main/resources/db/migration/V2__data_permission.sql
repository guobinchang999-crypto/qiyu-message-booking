-- Incremental migration for environments created before the data-permission model.
-- This migration is intentionally non-destructive and creates no database foreign keys.

USE qiyu_booking;

CREATE TABLE IF NOT EXISTS region (
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

ALTER TABLE store ADD COLUMN region_id BIGINT UNSIGNED NULL COMMENT '所属运营区域编号' AFTER id;
ALTER TABLE store ADD KEY idx_qy_store_region_status (region_id, enabled);

CREATE TABLE IF NOT EXISTS sys_dept (
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

CREATE TABLE IF NOT EXISTS sys_user_dept (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '统一用户编号',
  dept_id BIGINT UNSIGNED NOT NULL COMMENT '部门编号',
  is_primary TINYINT NOT NULL DEFAULT 0 COMMENT '1 主归属，0 兼职归属',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_sys_user_dept (user_id, dept_id),
  KEY idx_qy_sys_user_dept_dept (dept_id, is_primary)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户部门归属';

ALTER TABLE sys_role_permission ADD COLUMN effect VARCHAR(16) NOT NULL DEFAULT 'ALLOW' COMMENT '允许/拒绝' AFTER permission_id;
ALTER TABLE sys_role_permission ADD CONSTRAINT chk_qy_sys_role_permission_effect CHECK (effect IN ('ALLOW', 'DENY'));

CREATE TABLE IF NOT EXISTS sys_user_permission (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键',
  user_id BIGINT UNSIGNED NOT NULL COMMENT '统一用户编号',
  permission_id BIGINT UNSIGNED NOT NULL COMMENT '权限编号',
  effect VARCHAR(16) NOT NULL DEFAULT 'ALLOW' COMMENT '允许/拒绝',
  valid_from DATETIME NULL COMMENT '授权生效时间',
  valid_until DATETIME NULL COMMENT '授权失效时间',
  created_by_user_id BIGINT UNSIGNED NULL COMMENT '授权操作人统一用户编号',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (id),
  KEY idx_qy_sys_user_permission_lookup (user_id, permission_id, valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户直接权限授权';

ALTER TABLE sys_user_data_scope ADD COLUMN valid_from DATETIME NULL COMMENT '授权生效时间' AFTER scope_type;
ALTER TABLE sys_user_data_scope ADD COLUMN valid_until DATETIME NULL COMMENT '授权失效时间' AFTER valid_from;
ALTER TABLE sys_user_data_scope ADD COLUMN created_by_user_id BIGINT UNSIGNED NULL COMMENT '授权操作人统一用户编号' AFTER valid_until;
ALTER TABLE sys_user_data_scope DROP CHECK chk_qy_sys_user_data_scope_type;
ALTER TABLE sys_user_data_scope ADD CONSTRAINT chk_qy_sys_user_data_scope_type CHECK (scope_type IN ('NONE', 'SELF', 'PRIMARY_STORE', 'ASSIGNED_STORES', 'REGION_STORES', 'ALL_STORES'));
ALTER TABLE sys_user_data_scope DROP INDEX uk_qy_sys_user_data_scope;
ALTER TABLE sys_user_data_scope ADD KEY idx_qy_sys_user_data_scope_lookup (user_id, resource_code, action_code, valid_from, valid_until);
ALTER TABLE sys_user_scope_store ADD COLUMN valid_from DATETIME NULL COMMENT '授权生效时间' AFTER store_id;
ALTER TABLE sys_user_scope_store ADD COLUMN valid_until DATETIME NULL COMMENT '授权失效时间' AFTER valid_from;
ALTER TABLE sys_user_scope_store ADD COLUMN created_by_user_id BIGINT UNSIGNED NULL COMMENT '授权操作人统一用户编号' AFTER valid_until;
ALTER TABLE sys_user_scope_store DROP INDEX uk_qy_sys_user_scope_store;
ALTER TABLE sys_user_scope_store ADD KEY idx_qy_sys_user_scope_store_lookup (user_id, resource_code, action_code, valid_from, valid_until);
ALTER TABLE sys_role_data_scope DROP CHECK chk_qy_sys_role_data_scope_type;
ALTER TABLE sys_role_data_scope ADD CONSTRAINT chk_qy_sys_role_data_scope_type CHECK (scope_type IN ('NONE', 'SELF', 'PRIMARY_STORE', 'ASSIGNED_STORES', 'REGION_STORES', 'ALL_STORES'));

CREATE TABLE IF NOT EXISTS sys_role_scope_region (
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

CREATE TABLE IF NOT EXISTS sys_user_scope_region (
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
  KEY idx_qy_sys_user_scope_region_region (region_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='用户数据范围区域覆盖';

CREATE TABLE IF NOT EXISTS customer_store_relation (
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

CREATE TABLE IF NOT EXISTS audit_log (
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
