-- Qiyu massage booking schema for MySQL 8.0.
-- This DDL models the unified-brand booking flow shown in design/client-*-v2.png
-- and DEVELOPMENT-PLAN.md. Store type, independent merchant identity, and
-- store-level membership concepts are intentionally not modeled.

CREATE DATABASE IF NOT EXISTS qiyu_booking
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_0900_ai_ci;

USE qiyu_booking;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS qy_review_image;
DROP TABLE IF EXISTS qy_review_tag;
DROP TABLE IF EXISTS qy_service_review;
DROP TABLE IF EXISTS qy_coupon_usage;
DROP TABLE IF EXISTS qy_customer_coupon;
DROP TABLE IF EXISTS qy_coupon_template;
DROP TABLE IF EXISTS qy_member_package_usage;
DROP TABLE IF EXISTS qy_member_package_item;
DROP TABLE IF EXISTS qy_member_package_card;
DROP TABLE IF EXISTS qy_member_balance_transaction;
DROP TABLE IF EXISTS qy_member_account;
DROP TABLE IF EXISTS qy_report_job_run;
DROP TABLE IF EXISTS qy_therapist_daily_metrics;
DROP TABLE IF EXISTS qy_service_daily_metrics;
DROP TABLE IF EXISTS qy_store_daily_metrics;
DROP TABLE IF EXISTS qy_refund_order;
DROP TABLE IF EXISTS qy_payment_order;
DROP TABLE IF EXISTS qy_resource_occupation;
DROP TABLE IF EXISTS qy_service_order_log;
DROP TABLE IF EXISTS qy_service_order;
DROP TABLE IF EXISTS qy_checkin_record;
DROP TABLE IF EXISTS qy_booking_status_log;
DROP TABLE IF EXISTS qy_booking;
DROP TABLE IF EXISTS qy_time_slot_snapshot;
DROP TABLE IF EXISTS qy_therapist_leave;
DROP TABLE IF EXISTS qy_therapist_schedule;
DROP TABLE IF EXISTS qy_therapist_service;
DROP TABLE IF EXISTS qy_therapist_skill;
DROP TABLE IF EXISTS qy_therapist;
DROP TABLE IF EXISTS qy_room;
DROP TABLE IF EXISTS qy_service_item_tag;
DROP TABLE IF EXISTS qy_service_item;
DROP TABLE IF EXISTS qy_service_category;
DROP TABLE IF EXISTS qy_customer_contact;
DROP TABLE IF EXISTS qy_customer_favorite_store;
DROP TABLE IF EXISTS qy_customer_login_identity;
DROP TABLE IF EXISTS qy_customer;
DROP TABLE IF EXISTS qy_admin_user_store_scope;
DROP TABLE IF EXISTS qy_admin_user_role;
DROP TABLE IF EXISTS qy_admin_role_permission;
DROP TABLE IF EXISTS qy_admin_permission;
DROP TABLE IF EXISTS qy_admin_role;
DROP TABLE IF EXISTS qy_admin_user;
DROP TABLE IF EXISTS qy_store_service;
DROP TABLE IF EXISTS qy_store_facility;
DROP TABLE IF EXISTS qy_store_gallery;
DROP TABLE IF EXISTS qy_store_business_day;
DROP TABLE IF EXISTS qy_store;
DROP TABLE IF EXISTS qy_dict_item;
DROP TABLE IF EXISTS qy_dict_type;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE qy_dict_type (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  type_code VARCHAR(64) NOT NULL COMMENT 'Dictionary type code',
  type_name VARCHAR(64) NOT NULL COMMENT 'Dictionary type name',
  description VARCHAR(255) NULL COMMENT 'Dictionary description',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1 enabled, 0 disabled',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_dict_type_code (type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Dictionary type';

CREATE TABLE qy_dict_item (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  type_code VARCHAR(64) NOT NULL COMMENT 'Dictionary type code',
  item_code VARCHAR(64) NOT NULL COMMENT 'Dictionary item code',
  item_label VARCHAR(64) NOT NULL COMMENT 'Display label',
  item_value VARCHAR(128) NOT NULL COMMENT 'API value',
  extra_json JSON NULL COMMENT 'Extra metadata',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1 enabled, 0 disabled',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_dict_item_type_code (type_code, item_code),
  KEY idx_qy_dict_item_type_enabled (type_code, enabled, sort_order),
  CONSTRAINT fk_qy_dict_item_type FOREIGN KEY (type_code) REFERENCES qy_dict_type (type_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Dictionary item';

CREATE TABLE qy_store (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  store_code VARCHAR(32) NOT NULL COMMENT 'Store code',
  store_name VARCHAR(80) NOT NULL COMMENT 'Store name',
  cover_url VARCHAR(512) NULL COMMENT 'Store cover image',
  phone VARCHAR(32) NULL COMMENT 'Store phone',
  province VARCHAR(32) NULL COMMENT 'Province',
  city VARCHAR(32) NULL COMMENT 'City',
  district VARCHAR(32) NULL COMMENT 'District',
  address VARCHAR(255) NOT NULL COMMENT 'Address',
  longitude DECIMAL(10, 7) NULL COMMENT 'Longitude',
  latitude DECIMAL(10, 7) NULL COMMENT 'Latitude',
  business_hours VARCHAR(64) NOT NULL COMMENT 'Business hours text',
  open_time TIME NOT NULL COMMENT 'Daily open time',
  close_time TIME NOT NULL COMMENT 'Daily close time',
  business_status VARCHAR(32) NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN/CLOSED',
  rating DECIMAL(2, 1) NOT NULL DEFAULT 5.0 COMMENT 'Display rating',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1 enabled, 0 disabled',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_store_code (store_code),
  KEY idx_qy_store_city_status (city, business_status, enabled),
  KEY idx_qy_store_geo (longitude, latitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Unified brand store';

CREATE TABLE qy_store_gallery (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  image_url VARCHAR(512) NOT NULL COMMENT 'Image URL',
  image_title VARCHAR(80) NULL COMMENT 'Image title',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  KEY idx_qy_store_gallery_store (store_id, sort_order),
  CONSTRAINT fk_qy_store_gallery_store FOREIGN KEY (store_id) REFERENCES qy_store (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Store gallery';

CREATE TABLE qy_store_facility (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  facility_name VARCHAR(64) NOT NULL COMMENT 'Facility name',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  KEY idx_qy_store_facility_store (store_id, sort_order),
  CONSTRAINT fk_qy_store_facility_store FOREIGN KEY (store_id) REFERENCES qy_store (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Store facility';

CREATE TABLE qy_store_business_day (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  business_date DATE NOT NULL COMMENT 'Business date',
  open_time TIME NULL COMMENT 'Special open time',
  close_time TIME NULL COMMENT 'Special close time',
  day_status VARCHAR(32) NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN/CLOSED/SUSPENDED',
  reason VARCHAR(255) NULL COMMENT 'Reason shown by backend APIs when needed',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_store_business_day (store_id, business_date),
  KEY idx_qy_store_business_day_status (business_date, day_status),
  CONSTRAINT fk_qy_store_business_day_store FOREIGN KEY (store_id) REFERENCES qy_store (id),
  CONSTRAINT chk_qy_store_business_day_time CHECK (
    (day_status <> 'OPEN') OR (open_time IS NOT NULL AND close_time IS NOT NULL AND open_time < close_time)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Store special business day';

CREATE TABLE qy_admin_user (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  username VARCHAR(64) NOT NULL COMMENT 'Login username',
  mobile VARCHAR(32) NULL COMMENT 'Mobile',
  password_hash VARCHAR(255) NOT NULL COMMENT 'Password hash',
  display_name VARCHAR(64) NOT NULL COMMENT 'Display name',
  status VARCHAR(32) NOT NULL DEFAULT 'ENABLED' COMMENT 'ENABLED/DISABLED',
  last_login_at DATETIME NULL COMMENT 'Last login time',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_admin_user_username (username),
  UNIQUE KEY uk_qy_admin_user_mobile (mobile)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Admin user';

CREATE TABLE qy_admin_role (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  role_code VARCHAR(64) NOT NULL COMMENT 'Role code',
  role_name VARCHAR(64) NOT NULL COMMENT 'Role name',
  description VARCHAR(255) NULL COMMENT 'Description',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_admin_role_code (role_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Admin role';

CREATE TABLE qy_admin_permission (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  permission_code VARCHAR(128) NOT NULL COMMENT 'Permission code',
  permission_name VARCHAR(80) NOT NULL COMMENT 'Permission name',
  resource_path VARCHAR(128) NULL COMMENT 'Menu/API path',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_admin_permission_code (permission_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Admin permission';

CREATE TABLE qy_admin_user_role (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'Admin user id',
  role_id BIGINT UNSIGNED NOT NULL COMMENT 'Role id',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_admin_user_role (user_id, role_id),
  CONSTRAINT fk_qy_admin_user_role_user FOREIGN KEY (user_id) REFERENCES qy_admin_user (id),
  CONSTRAINT fk_qy_admin_user_role_role FOREIGN KEY (role_id) REFERENCES qy_admin_role (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Admin user role relation';

CREATE TABLE qy_admin_role_permission (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  role_id BIGINT UNSIGNED NOT NULL COMMENT 'Role id',
  permission_id BIGINT UNSIGNED NOT NULL COMMENT 'Permission id',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_admin_role_permission (role_id, permission_id),
  CONSTRAINT fk_qy_admin_role_permission_role FOREIGN KEY (role_id) REFERENCES qy_admin_role (id),
  CONSTRAINT fk_qy_admin_role_permission_permission FOREIGN KEY (permission_id) REFERENCES qy_admin_permission (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Admin role permission relation';

CREATE TABLE qy_admin_user_store_scope (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  user_id BIGINT UNSIGNED NOT NULL COMMENT 'Admin user id',
  store_id BIGINT UNSIGNED NULL COMMENT 'Store id, null when scope is all stores',
  scope_store_key BIGINT UNSIGNED GENERATED ALWAYS AS (IFNULL(store_id, 0)) STORED COMMENT 'Generated unique key for nullable store id',
  scope_type VARCHAR(32) NOT NULL DEFAULT 'STORE' COMMENT 'ALL_STORES/STORE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_admin_user_store_scope (user_id, scope_type, scope_store_key),
  KEY idx_qy_admin_user_store_scope_store (store_id),
  CONSTRAINT fk_qy_admin_user_store_scope_user FOREIGN KEY (user_id) REFERENCES qy_admin_user (id),
  CONSTRAINT fk_qy_admin_user_store_scope_store FOREIGN KEY (store_id) REFERENCES qy_store (id),
  CONSTRAINT chk_qy_admin_user_store_scope CHECK (
    (scope_type = 'ALL_STORES' AND store_id IS NULL) OR
    (scope_type = 'STORE' AND store_id IS NOT NULL)
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Admin user store data scope';

CREATE TABLE qy_customer (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  open_id VARCHAR(128) NULL COMMENT 'Wechat open id',
  union_id VARCHAR(128) NULL COMMENT 'Wechat union id',
  mobile VARCHAR(32) NOT NULL COMMENT 'Mobile',
  nickname VARCHAR(80) NULL COMMENT 'Nickname',
  avatar_url VARCHAR(512) NULL COMMENT 'Avatar URL',
  gender VARCHAR(16) NULL COMMENT 'Gender dictionary value',
  birthday DATE NULL COMMENT 'Birthday',
  member_level VARCHAR(32) NOT NULL DEFAULT 'REGULAR' COMMENT 'Member level dictionary value',
  last_visit_at DATETIME NULL COMMENT 'Last visit time',
  status VARCHAR(32) NOT NULL DEFAULT 'ENABLED' COMMENT 'ENABLED/DISABLED',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_customer_mobile (mobile),
  UNIQUE KEY uk_qy_customer_open_id (open_id),
  KEY idx_qy_customer_member_level (member_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Customer';

CREATE TABLE qy_customer_contact (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer id',
  contact_name VARCHAR(64) NOT NULL COMMENT 'Contact name',
  mobile VARCHAR(32) NOT NULL COMMENT 'Contact mobile',
  is_default TINYINT NOT NULL DEFAULT 0 COMMENT '1 default, 0 normal',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  KEY idx_qy_customer_contact_customer (customer_id, is_default),
  CONSTRAINT fk_qy_customer_contact_customer FOREIGN KEY (customer_id) REFERENCES qy_customer (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Customer contact';

CREATE TABLE qy_customer_login_identity (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer id',
  identity_type VARCHAR(32) NOT NULL COMMENT 'MOBILE/WECHAT_OPEN_ID/WECHAT_UNION_ID',
  identifier VARCHAR(128) NOT NULL COMMENT 'Login identifier',
  verified TINYINT NOT NULL DEFAULT 1 COMMENT '1 verified, 0 unverified',
  last_login_at DATETIME NULL COMMENT 'Last login time',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_customer_login_identity (identity_type, identifier),
  KEY idx_qy_customer_login_identity_customer (customer_id),
  CONSTRAINT fk_qy_customer_login_identity_customer FOREIGN KEY (customer_id) REFERENCES qy_customer (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Customer login identity';

CREATE TABLE qy_customer_favorite_store (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer id',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  visit_count INT NOT NULL DEFAULT 0 COMMENT 'Historical visit count',
  last_booking_at DATETIME NULL COMMENT 'Last booking time',
  is_pinned TINYINT NOT NULL DEFAULT 0 COMMENT '1 pinned as frequent store',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order among frequent stores',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_customer_favorite_store (customer_id, store_id),
  KEY idx_qy_customer_favorite_order (customer_id, is_pinned, sort_order, last_booking_at),
  CONSTRAINT fk_qy_customer_favorite_customer FOREIGN KEY (customer_id) REFERENCES qy_customer (id),
  CONSTRAINT fk_qy_customer_favorite_store FOREIGN KEY (store_id) REFERENCES qy_store (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Customer frequent store';

CREATE TABLE qy_service_category (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  category_code VARCHAR(32) NOT NULL COMMENT 'Category code',
  category_name VARCHAR(64) NOT NULL COMMENT 'Category name',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1 enabled, 0 disabled',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_service_category_code (category_code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Service category';

CREATE TABLE qy_service_item (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  service_code VARCHAR(32) NOT NULL COMMENT 'Service item code',
  category_id BIGINT UNSIGNED NOT NULL COMMENT 'Service category id',
  service_name VARCHAR(80) NOT NULL COMMENT 'Service item name',
  cover_url VARCHAR(512) NULL COMMENT 'Cover image URL',
  duration_minutes INT NOT NULL COMMENT 'Service duration minutes',
  preparation_minutes INT NOT NULL DEFAULT 10 COMMENT 'Preparation minutes before service',
  cleanup_minutes INT NOT NULL DEFAULT 10 COMMENT 'Cleanup minutes after service',
  price_amount DECIMAL(10, 2) NOT NULL COMMENT 'Standard price',
  member_price_amount DECIMAL(10, 2) NOT NULL COMMENT 'Member price',
  description TEXT NULL COMMENT 'Description',
  service_steps TEXT NULL COMMENT 'Service steps',
  suitable_people TEXT NULL COMMENT 'Suitable people',
  notices TEXT NULL COMMENT 'Notices',
  sales_count INT NOT NULL DEFAULT 0 COMMENT 'Display sales count',
  status VARCHAR(32) NOT NULL DEFAULT 'ON_SHELF' COMMENT 'ON_SHELF/OFF_SHELF',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_service_item_code (service_code),
  KEY idx_qy_service_item_category_status (category_id, status, sort_order),
  CONSTRAINT fk_qy_service_item_category FOREIGN KEY (category_id) REFERENCES qy_service_category (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Service item';

CREATE TABLE qy_service_item_tag (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT 'Service item id',
  tag_name VARCHAR(32) NOT NULL COMMENT 'Display tag name',
  tag_type VARCHAR(32) NOT NULL DEFAULT 'FEATURE' COMMENT 'FEATURE/CROWD/PROMOTION',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  KEY idx_qy_service_item_tag_service (service_item_id, sort_order),
  CONSTRAINT fk_qy_service_item_tag_service FOREIGN KEY (service_item_id) REFERENCES qy_service_item (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Service item display tag';

CREATE TABLE qy_store_service (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT 'Service item id',
  store_price_amount DECIMAL(10, 2) NULL COMMENT 'Optional store display price override',
  store_member_price_amount DECIMAL(10, 2) NULL COMMENT 'Optional store member price override',
  status VARCHAR(32) NOT NULL DEFAULT 'ON_SHELF' COMMENT 'ON_SHELF/OFF_SHELF',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order in store',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_store_service (store_id, service_item_id),
  KEY idx_qy_store_service_query (store_id, status, sort_order),
  CONSTRAINT fk_qy_store_service_store FOREIGN KEY (store_id) REFERENCES qy_store (id),
  CONSTRAINT fk_qy_store_service_service FOREIGN KEY (service_item_id) REFERENCES qy_service_item (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Store available service item';

CREATE TABLE qy_room (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  room_code VARCHAR(32) NOT NULL COMMENT 'Room code',
  room_name VARCHAR(64) NOT NULL COMMENT 'Room name',
  room_kind VARCHAR(32) NOT NULL COMMENT 'Room kind dictionary value',
  capacity INT NOT NULL DEFAULT 1 COMMENT 'Guest capacity',
  status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE' COMMENT 'Room status',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1 enabled, 0 disabled',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_room_store_code (store_id, room_code),
  KEY idx_qy_room_store_status (store_id, status, enabled),
  CONSTRAINT fk_qy_room_store FOREIGN KEY (store_id) REFERENCES qy_store (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Store room';

CREATE TABLE qy_therapist (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  therapist_code VARCHAR(32) NOT NULL COMMENT 'Therapist code',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Primary store id',
  therapist_name VARCHAR(64) NOT NULL COMMENT 'Therapist name',
  avatar_url VARCHAR(512) NULL COMMENT 'Avatar URL',
  portrait_url VARCHAR(512) NULL COMMENT 'Portrait URL',
  level_name VARCHAR(64) NOT NULL COMMENT 'Therapist level',
  experience_years INT NOT NULL DEFAULT 0 COMMENT 'Experience years',
  rating DECIMAL(2, 1) NOT NULL DEFAULT 5.0 COMMENT 'Display rating',
  service_count INT NOT NULL DEFAULT 0 COMMENT 'Service count',
  specify_fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Specify fee',
  status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE' COMMENT 'Therapist status',
  introduction TEXT NULL COMMENT 'Introduction',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1 enabled, 0 disabled',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_therapist_code (therapist_code),
  KEY idx_qy_therapist_store_status (store_id, status, enabled),
  CONSTRAINT fk_qy_therapist_store FOREIGN KEY (store_id) REFERENCES qy_store (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Therapist';

CREATE TABLE qy_therapist_skill (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  therapist_id BIGINT UNSIGNED NOT NULL COMMENT 'Therapist id',
  skill_name VARCHAR(64) NOT NULL COMMENT 'Skill name',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  KEY idx_qy_therapist_skill_therapist (therapist_id, sort_order),
  CONSTRAINT fk_qy_therapist_skill_therapist FOREIGN KEY (therapist_id) REFERENCES qy_therapist (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Therapist skill';

CREATE TABLE qy_therapist_service (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  therapist_id BIGINT UNSIGNED NOT NULL COMMENT 'Therapist id',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT 'Service item id',
  enabled TINYINT NOT NULL DEFAULT 1 COMMENT '1 enabled, 0 disabled',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_therapist_service (therapist_id, service_item_id),
  CONSTRAINT fk_qy_therapist_service_therapist FOREIGN KEY (therapist_id) REFERENCES qy_therapist (id),
  CONSTRAINT fk_qy_therapist_service_service FOREIGN KEY (service_item_id) REFERENCES qy_service_item (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Therapist service capability';

CREATE TABLE qy_therapist_schedule (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  therapist_id BIGINT UNSIGNED NOT NULL COMMENT 'Therapist id',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  work_date DATE NOT NULL COMMENT 'Work date',
  start_time TIME NOT NULL COMMENT 'Start time',
  end_time TIME NOT NULL COMMENT 'End time',
  schedule_status VARCHAR(32) NOT NULL DEFAULT 'WORK' COMMENT 'WORK/REST/LEAVE',
  remark VARCHAR(255) NULL COMMENT 'Remark',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  KEY idx_qy_therapist_schedule_therapist_date (therapist_id, work_date, start_time),
  KEY idx_qy_therapist_schedule_store_date (store_id, work_date),
  CONSTRAINT fk_qy_therapist_schedule_therapist FOREIGN KEY (therapist_id) REFERENCES qy_therapist (id),
  CONSTRAINT fk_qy_therapist_schedule_store FOREIGN KEY (store_id) REFERENCES qy_store (id),
  CONSTRAINT chk_qy_therapist_schedule_time CHECK (start_time < end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Therapist schedule';

CREATE TABLE qy_therapist_leave (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  therapist_id BIGINT UNSIGNED NOT NULL COMMENT 'Therapist id',
  leave_start_at DATETIME NOT NULL COMMENT 'Leave start time',
  leave_end_at DATETIME NOT NULL COMMENT 'Leave end time',
  reason VARCHAR(255) NULL COMMENT 'Reason',
  approval_status VARCHAR(32) NOT NULL DEFAULT 'APPROVED' COMMENT 'Approval status',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  KEY idx_qy_therapist_leave_time (therapist_id, leave_start_at, leave_end_at),
  CONSTRAINT fk_qy_therapist_leave_therapist FOREIGN KEY (therapist_id) REFERENCES qy_therapist (id),
  CONSTRAINT chk_qy_therapist_leave_time CHECK (leave_start_at < leave_end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Therapist leave';

CREATE TABLE qy_time_slot_snapshot (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT 'Service item id',
  therapist_id BIGINT UNSIGNED NULL COMMENT 'Therapist id when specified',
  slot_date DATE NOT NULL COMMENT 'Slot date',
  start_time TIME NOT NULL COMMENT 'Slot start time',
  end_time TIME NOT NULL COMMENT 'Slot end time',
  period VARCHAR(32) NOT NULL COMMENT 'MORNING/AFTERNOON/EVENING',
  status VARCHAR(32) NOT NULL DEFAULT 'AVAILABLE' COMMENT 'Time slot status',
  remaining_capacity INT NOT NULL DEFAULT 1 COMMENT 'Remaining capacity',
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Generated time',
  PRIMARY KEY (id),
  KEY idx_qy_time_slot_query (store_id, service_item_id, slot_date, period, status),
  KEY idx_qy_time_slot_therapist (therapist_id, slot_date, start_time),
  CONSTRAINT fk_qy_time_slot_store FOREIGN KEY (store_id) REFERENCES qy_store (id),
  CONSTRAINT fk_qy_time_slot_service FOREIGN KEY (service_item_id) REFERENCES qy_service_item (id),
  CONSTRAINT fk_qy_time_slot_therapist FOREIGN KEY (therapist_id) REFERENCES qy_therapist (id),
  CONSTRAINT chk_qy_time_slot_time CHECK (start_time < end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Bookable time slot snapshot';

CREATE TABLE qy_booking (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  booking_no VARCHAR(32) NOT NULL COMMENT 'Booking number',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer id',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT 'Service item id',
  therapist_mode VARCHAR(32) NOT NULL DEFAULT 'SPECIFIED' COMMENT 'SPECIFIED/AUTO',
  therapist_id BIGINT UNSIGNED NULL COMMENT 'Therapist id',
  room_id BIGINT UNSIGNED NULL COMMENT 'Room id',
  scheduled_start_at DATETIME NOT NULL COMMENT 'Scheduled start time',
  scheduled_end_at DATETIME NOT NULL COMMENT 'Scheduled end time',
  occupied_start_at DATETIME NOT NULL COMMENT 'Resource occupied start including preparation',
  occupied_end_at DATETIME NOT NULL COMMENT 'Resource occupied end including cleanup',
  guest_count INT NOT NULL DEFAULT 1 COMMENT 'Guest count',
  contact_name VARCHAR(64) NOT NULL COMMENT 'Contact name',
  contact_mobile VARCHAR(32) NOT NULL COMMENT 'Contact mobile',
  remark VARCHAR(500) NULL COMMENT 'Customer remark',
  booking_source VARCHAR(32) NOT NULL DEFAULT 'MINI_PROGRAM' COMMENT 'MINI_PROGRAM/ADMIN',
  status VARCHAR(32) NOT NULL COMMENT 'Booking status',
  item_amount DECIMAL(10, 2) NOT NULL COMMENT 'Service item amount',
  therapist_fee_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Therapist specify fee',
  discount_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Discount amount',
  balance_deduction_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Balance deduction amount',
  deposit_due_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Deposit due amount',
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Paid amount',
  cancelled_at DATETIME NULL COMMENT 'Cancelled time',
  cancel_reason VARCHAR(255) NULL COMMENT 'Cancel reason',
  request_id VARCHAR(64) NULL COMMENT 'Idempotency request id',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_booking_no (booking_no),
  UNIQUE KEY uk_qy_booking_request (request_id),
  KEY idx_qy_booking_customer_time (customer_id, scheduled_start_at),
  KEY idx_qy_booking_store_status_time (store_id, status, scheduled_start_at),
  KEY idx_qy_booking_therapist_occupied (therapist_id, occupied_start_at, occupied_end_at),
  KEY idx_qy_booking_room_occupied (room_id, occupied_start_at, occupied_end_at),
  CONSTRAINT fk_qy_booking_customer FOREIGN KEY (customer_id) REFERENCES qy_customer (id),
  CONSTRAINT fk_qy_booking_store FOREIGN KEY (store_id) REFERENCES qy_store (id),
  CONSTRAINT fk_qy_booking_service FOREIGN KEY (service_item_id) REFERENCES qy_service_item (id),
  CONSTRAINT fk_qy_booking_therapist FOREIGN KEY (therapist_id) REFERENCES qy_therapist (id),
  CONSTRAINT fk_qy_booking_room FOREIGN KEY (room_id) REFERENCES qy_room (id),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Booking';

CREATE TABLE qy_booking_status_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  booking_id BIGINT UNSIGNED NOT NULL COMMENT 'Booking id',
  from_status VARCHAR(32) NULL COMMENT 'From status',
  to_status VARCHAR(32) NOT NULL COMMENT 'To status',
  operation VARCHAR(64) NOT NULL COMMENT 'Operation',
  operator_type VARCHAR(32) NOT NULL COMMENT 'CUSTOMER/ADMIN/SYSTEM',
  operator_id BIGINT UNSIGNED NULL COMMENT 'Operator id',
  remark VARCHAR(255) NULL COMMENT 'Remark',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  PRIMARY KEY (id),
  KEY idx_qy_booking_status_log_booking (booking_id, created_at),
  CONSTRAINT fk_qy_booking_status_log_booking FOREIGN KEY (booking_id) REFERENCES qy_booking (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Booking status log';

CREATE TABLE qy_checkin_record (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  booking_id BIGINT UNSIGNED NOT NULL COMMENT 'Booking id',
  checkin_code VARCHAR(16) NOT NULL COMMENT 'Checkin code',
  qr_payload VARCHAR(512) NULL COMMENT 'QR payload',
  checked_in_at DATETIME NULL COMMENT 'Checked in time',
  checkin_status VARCHAR(32) NOT NULL DEFAULT 'WAITING' COMMENT 'WAITING/CHECKED_IN/EXPIRED',
  operator_id BIGINT UNSIGNED NULL COMMENT 'Admin operator id',
  request_id VARCHAR(64) NULL COMMENT 'Idempotency request id',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_checkin_record_booking (booking_id),
  UNIQUE KEY uk_qy_checkin_record_request (request_id),
  KEY idx_qy_checkin_record_code (checkin_code),
  CONSTRAINT fk_qy_checkin_record_booking FOREIGN KEY (booking_id) REFERENCES qy_booking (id),
  CONSTRAINT fk_qy_checkin_record_operator FOREIGN KEY (operator_id) REFERENCES qy_admin_user (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Checkin record';

CREATE TABLE qy_service_order (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  service_order_no VARCHAR(32) NOT NULL COMMENT 'Service order number',
  booking_id BIGINT UNSIGNED NOT NULL COMMENT 'Booking id',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer id',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT 'Service item id',
  therapist_id BIGINT UNSIGNED NULL COMMENT 'Therapist id',
  room_id BIGINT UNSIGNED NULL COMMENT 'Room id',
  status VARCHAR(32) NOT NULL COMMENT 'Service order status',
  started_at DATETIME NULL COMMENT 'Service start time',
  finished_at DATETIME NULL COMMENT 'Service finish time',
  settlement_at DATETIME NULL COMMENT 'Settlement time',
  payable_amount DECIMAL(10, 2) NOT NULL COMMENT 'Payable amount',
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Paid amount',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_service_order_no (service_order_no),
  UNIQUE KEY uk_qy_service_order_booking (booking_id),
  KEY idx_qy_service_order_store_status (store_id, status, created_at),
  KEY idx_qy_service_order_therapist_status (therapist_id, status, created_at),
  KEY idx_qy_service_order_room_status (room_id, status, created_at),
  CONSTRAINT fk_qy_service_order_booking FOREIGN KEY (booking_id) REFERENCES qy_booking (id),
  CONSTRAINT fk_qy_service_order_customer FOREIGN KEY (customer_id) REFERENCES qy_customer (id),
  CONSTRAINT fk_qy_service_order_store FOREIGN KEY (store_id) REFERENCES qy_store (id),
  CONSTRAINT fk_qy_service_order_service FOREIGN KEY (service_item_id) REFERENCES qy_service_item (id),
  CONSTRAINT fk_qy_service_order_therapist FOREIGN KEY (therapist_id) REFERENCES qy_therapist (id),
  CONSTRAINT fk_qy_service_order_room FOREIGN KEY (room_id) REFERENCES qy_room (id),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Service order';

CREATE TABLE qy_resource_occupation (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  resource_type VARCHAR(32) NOT NULL COMMENT 'THERAPIST/ROOM',
  resource_id BIGINT UNSIGNED NOT NULL COMMENT 'Therapist id or room id',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  booking_id BIGINT UNSIGNED NULL COMMENT 'Booking id',
  service_order_id BIGINT UNSIGNED NULL COMMENT 'Service order id',
  occupied_start_at DATETIME NOT NULL COMMENT 'Occupation start including preparation',
  occupied_end_at DATETIME NOT NULL COMMENT 'Occupation end including cleanup',
  occupation_status VARCHAR(32) NOT NULL DEFAULT 'HELD' COMMENT 'HELD/OCCUPIED/RELEASED/CANCELLED',
  occupation_reason VARCHAR(32) NOT NULL DEFAULT 'BOOKING' COMMENT 'BOOKING/SERVICE/CLEANING/MAINTENANCE',
  request_id VARCHAR(64) NULL COMMENT 'Idempotency request id',
  released_at DATETIME NULL COMMENT 'Released time',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_resource_occupation_request (request_id),
  KEY idx_qy_resource_occupation_conflict (resource_type, resource_id, occupation_status, occupied_start_at, occupied_end_at),
  KEY idx_qy_resource_occupation_store_time (store_id, occupied_start_at, occupied_end_at),
  KEY idx_qy_resource_occupation_booking (booking_id),
  CONSTRAINT fk_qy_resource_occupation_store FOREIGN KEY (store_id) REFERENCES qy_store (id),
  CONSTRAINT fk_qy_resource_occupation_booking FOREIGN KEY (booking_id) REFERENCES qy_booking (id),
  CONSTRAINT fk_qy_resource_occupation_order FOREIGN KEY (service_order_id) REFERENCES qy_service_order (id),
  CONSTRAINT chk_qy_resource_occupation_time CHECK (occupied_start_at < occupied_end_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Resource occupation for therapist and room conflict checks';

CREATE TABLE qy_service_order_log (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  service_order_id BIGINT UNSIGNED NOT NULL COMMENT 'Service order id',
  from_status VARCHAR(32) NULL COMMENT 'From status',
  to_status VARCHAR(32) NOT NULL COMMENT 'To status',
  operation VARCHAR(64) NOT NULL COMMENT 'Operation',
  operator_id BIGINT UNSIGNED NULL COMMENT 'Admin operator id',
  remark VARCHAR(255) NULL COMMENT 'Remark',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  PRIMARY KEY (id),
  KEY idx_qy_service_order_log_order (service_order_id, created_at),
  CONSTRAINT fk_qy_service_order_log_order FOREIGN KEY (service_order_id) REFERENCES qy_service_order (id),
  CONSTRAINT fk_qy_service_order_log_operator FOREIGN KEY (operator_id) REFERENCES qy_admin_user (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Service order status log';

CREATE TABLE qy_payment_order (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  payment_no VARCHAR(32) NOT NULL COMMENT 'Payment order number',
  booking_id BIGINT UNSIGNED NULL COMMENT 'Booking id',
  service_order_id BIGINT UNSIGNED NULL COMMENT 'Service order id',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer id',
  payment_purpose VARCHAR(32) NOT NULL COMMENT 'DEPOSIT/BALANCE/REFUND',
  payment_channel VARCHAR(32) NOT NULL DEFAULT 'MOCK' COMMENT 'Payment channel',
  payment_status VARCHAR(32) NOT NULL COMMENT 'Payment status',
  payable_amount DECIMAL(10, 2) NOT NULL COMMENT 'Payable amount',
  paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Paid amount',
  paid_at DATETIME NULL COMMENT 'Paid time',
  external_trade_no VARCHAR(128) NULL COMMENT 'External trade no',
  refund_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Refund amount',
  refunded_at DATETIME NULL COMMENT 'Refunded time',
  request_id VARCHAR(64) NULL COMMENT 'Idempotency request id',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_payment_no (payment_no),
  UNIQUE KEY uk_qy_payment_request (request_id),
  KEY idx_qy_payment_booking (booking_id),
  KEY idx_qy_payment_customer_status (customer_id, payment_status, created_at),
  CONSTRAINT fk_qy_payment_booking FOREIGN KEY (booking_id) REFERENCES qy_booking (id),
  CONSTRAINT fk_qy_payment_service_order FOREIGN KEY (service_order_id) REFERENCES qy_service_order (id),
  CONSTRAINT fk_qy_payment_customer FOREIGN KEY (customer_id) REFERENCES qy_customer (id),
  CONSTRAINT chk_qy_payment_order_amount CHECK (
    payable_amount >= 0 AND paid_amount >= 0 AND refund_amount >= 0
  ),
  CONSTRAINT chk_qy_payment_order_status CHECK (
    payment_status IN ('UNPAID', 'DEPOSIT_PAID', 'PAID', 'REFUNDING', 'REFUNDED', 'CLOSED')
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Payment order';

CREATE TABLE qy_refund_order (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  refund_no VARCHAR(32) NOT NULL COMMENT 'Refund order number',
  payment_order_id BIGINT UNSIGNED NOT NULL COMMENT 'Original payment order id',
  booking_id BIGINT UNSIGNED NULL COMMENT 'Booking id',
  service_order_id BIGINT UNSIGNED NULL COMMENT 'Service order id',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer id',
  refund_channel VARCHAR(32) NOT NULL DEFAULT 'MOCK' COMMENT 'Refund channel',
  refund_status VARCHAR(32) NOT NULL DEFAULT 'REFUNDING' COMMENT 'REFUNDING/REFUNDED/FAILED/CLOSED',
  refund_reason VARCHAR(255) NULL COMMENT 'Refund reason',
  refund_amount DECIMAL(10, 2) NOT NULL COMMENT 'Refund amount',
  external_refund_no VARCHAR(128) NULL COMMENT 'External refund no',
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Refund requested time',
  refunded_at DATETIME NULL COMMENT 'Refund completed time',
  request_id VARCHAR(64) NULL COMMENT 'Idempotency request id',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_refund_no (refund_no),
  UNIQUE KEY uk_qy_refund_request (request_id),
  KEY idx_qy_refund_payment (payment_order_id),
  KEY idx_qy_refund_customer_status (customer_id, refund_status, created_at),
  CONSTRAINT fk_qy_refund_payment FOREIGN KEY (payment_order_id) REFERENCES qy_payment_order (id),
  CONSTRAINT fk_qy_refund_booking FOREIGN KEY (booking_id) REFERENCES qy_booking (id),
  CONSTRAINT fk_qy_refund_service_order FOREIGN KEY (service_order_id) REFERENCES qy_service_order (id),
  CONSTRAINT fk_qy_refund_customer FOREIGN KEY (customer_id) REFERENCES qy_customer (id),
  CONSTRAINT chk_qy_refund_amount CHECK (refund_amount > 0),
  CONSTRAINT chk_qy_refund_status CHECK (refund_status IN ('REFUNDING', 'REFUNDED', 'FAILED', 'CLOSED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Refund order reserved for payment integration';

CREATE TABLE qy_store_daily_metrics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  stat_date DATE NOT NULL COMMENT 'Statistics date',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  booking_count INT NOT NULL DEFAULT 0 COMMENT 'Created booking count',
  completed_order_count INT NOT NULL DEFAULT 0 COMMENT 'Completed service order count',
  cancelled_booking_count INT NOT NULL DEFAULT 0 COMMENT 'Cancelled booking count',
  checked_in_count INT NOT NULL DEFAULT 0 COMMENT 'Checked in count',
  gross_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Gross payable amount',
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Paid amount',
  refund_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Refund amount',
  discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Discount amount',
  member_balance_consume_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Member balance consume amount',
  package_usage_times INT NOT NULL DEFAULT 0 COMMENT 'Package usage times',
  new_customer_count INT NOT NULL DEFAULT 0 COMMENT 'New customer count',
  review_count INT NOT NULL DEFAULT 0 COMMENT 'Review count',
  average_rating DECIMAL(3, 2) NULL COMMENT 'Average review rating',
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Generated time',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_store_daily_metrics (stat_date, store_id),
  KEY idx_qy_store_daily_metrics_store_date (store_id, stat_date),
  CONSTRAINT fk_qy_store_daily_metrics_store FOREIGN KEY (store_id) REFERENCES qy_store (id),
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Store daily operation metrics';

CREATE TABLE qy_service_daily_metrics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  stat_date DATE NOT NULL COMMENT 'Statistics date',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT 'Service item id',
  booking_count INT NOT NULL DEFAULT 0 COMMENT 'Created booking count',
  completed_order_count INT NOT NULL DEFAULT 0 COMMENT 'Completed service order count',
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Paid amount',
  refund_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Refund amount',
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Generated time',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_service_daily_metrics (stat_date, store_id, service_item_id),
  KEY idx_qy_service_daily_metrics_service_date (service_item_id, stat_date),
  CONSTRAINT fk_qy_service_daily_metrics_store FOREIGN KEY (store_id) REFERENCES qy_store (id),
  CONSTRAINT fk_qy_service_daily_metrics_service FOREIGN KEY (service_item_id) REFERENCES qy_service_item (id),
  CONSTRAINT chk_qy_service_daily_metrics_non_negative CHECK (
    booking_count >= 0 AND
    completed_order_count >= 0 AND
    paid_amount >= 0 AND
    refund_amount >= 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Service item daily operation metrics';

CREATE TABLE qy_therapist_daily_metrics (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  stat_date DATE NOT NULL COMMENT 'Statistics date',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  therapist_id BIGINT UNSIGNED NOT NULL COMMENT 'Therapist id',
  scheduled_count INT NOT NULL DEFAULT 0 COMMENT 'Scheduled booking count',
  completed_order_count INT NOT NULL DEFAULT 0 COMMENT 'Completed service order count',
  service_minutes INT NOT NULL DEFAULT 0 COMMENT 'Actual service minutes',
  paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00 COMMENT 'Paid amount',
  review_count INT NOT NULL DEFAULT 0 COMMENT 'Review count',
  average_rating DECIMAL(3, 2) NULL COMMENT 'Average review rating',
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Generated time',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_therapist_daily_metrics (stat_date, store_id, therapist_id),
  KEY idx_qy_therapist_daily_metrics_therapist_date (therapist_id, stat_date),
  CONSTRAINT fk_qy_therapist_daily_metrics_store FOREIGN KEY (store_id) REFERENCES qy_store (id),
  CONSTRAINT fk_qy_therapist_daily_metrics_therapist FOREIGN KEY (therapist_id) REFERENCES qy_therapist (id),
  CONSTRAINT chk_qy_therapist_daily_metrics_non_negative CHECK (
    scheduled_count >= 0 AND
    completed_order_count >= 0 AND
    service_minutes >= 0 AND
    paid_amount >= 0 AND
    review_count >= 0
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Therapist daily operation metrics';

CREATE TABLE qy_report_job_run (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  job_code VARCHAR(64) NOT NULL COMMENT 'Report job code',
  stat_date DATE NOT NULL COMMENT 'Statistics date',
  run_status VARCHAR(32) NOT NULL DEFAULT 'SUCCESS' COMMENT 'SUCCESS/FAILED',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Started time',
  finished_at DATETIME NULL COMMENT 'Finished time',
  error_message VARCHAR(500) NULL COMMENT 'Error message',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  PRIMARY KEY (id),
  KEY idx_qy_report_job_run_query (job_code, stat_date, started_at),
  CONSTRAINT chk_qy_report_job_run_status CHECK (run_status IN ('SUCCESS', 'FAILED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Report generation job run log';

CREATE TABLE qy_member_account (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer id',
  account_scope VARCHAR(32) NOT NULL DEFAULT 'ALL_STORES' COMMENT 'Always all stores for unified brand',
  balance_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Balance amount',
  total_recharge_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total recharge amount',
  total_consume_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Total consume amount',
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/FROZEN',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_member_account_customer (customer_id),
  CONSTRAINT fk_qy_member_account_customer FOREIGN KEY (customer_id) REFERENCES qy_customer (id),
  CONSTRAINT chk_qy_member_account_scope CHECK (account_scope = 'ALL_STORES')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Member account shared by all stores';

CREATE TABLE qy_member_balance_transaction (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  account_id BIGINT UNSIGNED NOT NULL COMMENT 'Member account id',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer id',
  booking_id BIGINT UNSIGNED NULL COMMENT 'Booking id',
  service_order_id BIGINT UNSIGNED NULL COMMENT 'Service order id',
  transaction_no VARCHAR(32) NOT NULL COMMENT 'Balance transaction number',
  transaction_type VARCHAR(32) NOT NULL COMMENT 'RECHARGE/CONSUME/REFUND/ADJUST',
  amount DECIMAL(10, 2) NOT NULL COMMENT 'Positive amount for ledger entry',
  balance_after DECIMAL(10, 2) NOT NULL COMMENT 'Balance after transaction',
  remark VARCHAR(255) NULL COMMENT 'Remark',
  request_id VARCHAR(64) NULL COMMENT 'Idempotency request id',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_member_balance_transaction_no (transaction_no),
  UNIQUE KEY uk_qy_member_balance_transaction_request (request_id),
  KEY idx_qy_member_balance_transaction_customer (customer_id, created_at),
  CONSTRAINT fk_qy_member_balance_transaction_account FOREIGN KEY (account_id) REFERENCES qy_member_account (id),
  CONSTRAINT fk_qy_member_balance_transaction_customer FOREIGN KEY (customer_id) REFERENCES qy_customer (id),
  CONSTRAINT fk_qy_member_balance_transaction_booking FOREIGN KEY (booking_id) REFERENCES qy_booking (id),
  CONSTRAINT fk_qy_member_balance_transaction_order FOREIGN KEY (service_order_id) REFERENCES qy_service_order (id),
  CONSTRAINT chk_qy_member_balance_transaction_amount CHECK (amount > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Member balance transaction';

CREATE TABLE qy_member_package_card (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer id',
  card_no VARCHAR(32) NOT NULL COMMENT 'Package card number',
  package_name VARCHAR(80) NOT NULL COMMENT 'Package name',
  package_scope VARCHAR(32) NOT NULL DEFAULT 'ALL_STORES' COMMENT 'Always all stores for unified brand',
  total_times INT NOT NULL COMMENT 'Total times',
  remaining_times INT NOT NULL COMMENT 'Remaining times',
  valid_start_date DATE NOT NULL COMMENT 'Valid start date',
  valid_end_date DATE NOT NULL COMMENT 'Valid end date',
  status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT 'ACTIVE/EXPIRED/USED_UP',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_member_package_card_no (card_no),
  KEY idx_qy_member_package_customer_status (customer_id, status),
  CONSTRAINT fk_qy_member_package_customer FOREIGN KEY (customer_id) REFERENCES qy_customer (id),
  CONSTRAINT chk_qy_member_package_scope CHECK (package_scope = 'ALL_STORES')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Member package card shared by all stores';

CREATE TABLE qy_member_package_item (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  package_card_id BIGINT UNSIGNED NOT NULL COMMENT 'Package card id',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT 'Service item id',
  total_times INT NOT NULL COMMENT 'Total times',
  remaining_times INT NOT NULL COMMENT 'Remaining times',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_member_package_item_service (package_card_id, service_item_id),
  CONSTRAINT fk_qy_member_package_item_card FOREIGN KEY (package_card_id) REFERENCES qy_member_package_card (id),
  CONSTRAINT fk_qy_member_package_item_service FOREIGN KEY (service_item_id) REFERENCES qy_service_item (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Member package service item';

CREATE TABLE qy_member_package_usage (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  package_card_id BIGINT UNSIGNED NOT NULL COMMENT 'Package card id',
  package_item_id BIGINT UNSIGNED NOT NULL COMMENT 'Package item id',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer id',
  booking_id BIGINT UNSIGNED NULL COMMENT 'Booking id',
  service_order_id BIGINT UNSIGNED NULL COMMENT 'Service order id',
  used_times INT NOT NULL DEFAULT 1 COMMENT 'Used service times',
  remaining_times_after INT NOT NULL COMMENT 'Remaining times after usage',
  usage_status VARCHAR(32) NOT NULL DEFAULT 'CONFIRMED' COMMENT 'CONFIRMED/REVERSED',
  request_id VARCHAR(64) NULL COMMENT 'Idempotency request id',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_member_package_usage_request (request_id),
  KEY idx_qy_member_package_usage_customer (customer_id, created_at),
  CONSTRAINT fk_qy_member_package_usage_card FOREIGN KEY (package_card_id) REFERENCES qy_member_package_card (id),
  CONSTRAINT fk_qy_member_package_usage_item FOREIGN KEY (package_item_id) REFERENCES qy_member_package_item (id),
  CONSTRAINT fk_qy_member_package_usage_customer FOREIGN KEY (customer_id) REFERENCES qy_customer (id),
  CONSTRAINT fk_qy_member_package_usage_booking FOREIGN KEY (booking_id) REFERENCES qy_booking (id),
  CONSTRAINT fk_qy_member_package_usage_order FOREIGN KEY (service_order_id) REFERENCES qy_service_order (id),
  CONSTRAINT chk_qy_member_package_usage_times CHECK (used_times > 0 AND remaining_times_after >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Member package usage';

CREATE TABLE qy_coupon_template (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  coupon_code VARCHAR(32) NOT NULL COMMENT 'Coupon template code',
  coupon_name VARCHAR(80) NOT NULL COMMENT 'Coupon name',
  coupon_scope VARCHAR(32) NOT NULL DEFAULT 'ALL_STORES' COMMENT 'Always all stores for unified brand',
  discount_type VARCHAR(32) NOT NULL COMMENT 'AMOUNT/PERCENT',
  discount_amount DECIMAL(10, 2) NULL COMMENT 'Discount amount',
  discount_percent DECIMAL(5, 2) NULL COMMENT 'Discount percent',
  threshold_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Threshold amount',
  valid_start_at DATETIME NOT NULL COMMENT 'Valid start time',
  valid_end_at DATETIME NOT NULL COMMENT 'Valid end time',
  issued_count INT NOT NULL DEFAULT 0 COMMENT 'Issued count',
  used_count INT NOT NULL DEFAULT 0 COMMENT 'Used count',
  status VARCHAR(32) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT/ACTIVE/ENDED',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_by VARCHAR(64) NULL COMMENT 'Creator',
  updated_by VARCHAR(64) NULL COMMENT 'Updater',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_coupon_template_code (coupon_code),
  KEY idx_qy_coupon_template_status_time (status, valid_start_at, valid_end_at),
  CONSTRAINT chk_qy_coupon_template_scope CHECK (coupon_scope = 'ALL_STORES')
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Coupon template shared by all stores';

CREATE TABLE qy_customer_coupon (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer id',
  coupon_template_id BIGINT UNSIGNED NOT NULL COMMENT 'Coupon template id',
  coupon_no VARCHAR(32) NOT NULL COMMENT 'Customer coupon number',
  status VARCHAR(32) NOT NULL DEFAULT 'UNUSED' COMMENT 'UNUSED/USED/EXPIRED',
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Received time',
  used_at DATETIME NULL COMMENT 'Used time',
  valid_start_at DATETIME NOT NULL COMMENT 'Valid start time',
  valid_end_at DATETIME NOT NULL COMMENT 'Valid end time',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_customer_coupon_no (coupon_no),
  KEY idx_qy_customer_coupon_customer_status (customer_id, status, valid_end_at),
  CONSTRAINT fk_qy_customer_coupon_customer FOREIGN KEY (customer_id) REFERENCES qy_customer (id),
  CONSTRAINT fk_qy_customer_coupon_template FOREIGN KEY (coupon_template_id) REFERENCES qy_coupon_template (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Customer coupon';

CREATE TABLE qy_coupon_usage (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  customer_coupon_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer coupon id',
  booking_id BIGINT UNSIGNED NULL COMMENT 'Booking id',
  service_order_id BIGINT UNSIGNED NULL COMMENT 'Service order id',
  discount_amount DECIMAL(10, 2) NOT NULL COMMENT 'Discount amount',
  used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Used time',
  PRIMARY KEY (id),
  KEY idx_qy_coupon_usage_coupon (customer_coupon_id),
  CONSTRAINT fk_qy_coupon_usage_coupon FOREIGN KEY (customer_coupon_id) REFERENCES qy_customer_coupon (id),
  CONSTRAINT fk_qy_coupon_usage_booking FOREIGN KEY (booking_id) REFERENCES qy_booking (id),
  CONSTRAINT fk_qy_coupon_usage_service_order FOREIGN KEY (service_order_id) REFERENCES qy_service_order (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Coupon usage';

CREATE TABLE qy_service_review (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  booking_id BIGINT UNSIGNED NOT NULL COMMENT 'Booking id',
  service_order_id BIGINT UNSIGNED NULL COMMENT 'Service order id',
  customer_id BIGINT UNSIGNED NOT NULL COMMENT 'Customer id',
  store_id BIGINT UNSIGNED NOT NULL COMMENT 'Store id',
  therapist_id BIGINT UNSIGNED NULL COMMENT 'Therapist id',
  service_item_id BIGINT UNSIGNED NOT NULL COMMENT 'Service item id',
  therapist_rating TINYINT NOT NULL COMMENT 'Therapist rating 1-5',
  environment_rating TINYINT NOT NULL COMMENT 'Environment rating 1-5',
  service_rating TINYINT NOT NULL COMMENT 'Service rating 1-5',
  tags VARCHAR(255) NULL COMMENT 'Comma separated tags',
  content VARCHAR(600) NULL COMMENT 'Review content',
  anonymous TINYINT NOT NULL DEFAULT 1 COMMENT '1 anonymous, 0 public',
  status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED' COMMENT 'PUBLISHED/HIDDEN',
  deleted TINYINT NOT NULL DEFAULT 0 COMMENT 'Soft delete flag',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Updated time',
  PRIMARY KEY (id),
  UNIQUE KEY uk_qy_service_review_booking (booking_id),
  KEY idx_qy_service_review_store (store_id, created_at),
  KEY idx_qy_service_review_therapist (therapist_id, created_at),
  CONSTRAINT fk_qy_service_review_booking FOREIGN KEY (booking_id) REFERENCES qy_booking (id),
  CONSTRAINT fk_qy_service_review_service_order FOREIGN KEY (service_order_id) REFERENCES qy_service_order (id),
  CONSTRAINT fk_qy_service_review_customer FOREIGN KEY (customer_id) REFERENCES qy_customer (id),
  CONSTRAINT fk_qy_service_review_store FOREIGN KEY (store_id) REFERENCES qy_store (id),
  CONSTRAINT fk_qy_service_review_therapist FOREIGN KEY (therapist_id) REFERENCES qy_therapist (id),
  CONSTRAINT fk_qy_service_review_service FOREIGN KEY (service_item_id) REFERENCES qy_service_item (id),
  CONSTRAINT chk_qy_service_review_rating CHECK (
    therapist_rating BETWEEN 1 AND 5 AND
    environment_rating BETWEEN 1 AND 5 AND
    service_rating BETWEEN 1 AND 5
  )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Service review';

CREATE TABLE qy_review_tag (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  review_id BIGINT UNSIGNED NOT NULL COMMENT 'Review id',
  tag_name VARCHAR(32) NOT NULL COMMENT 'Review tag name',
  tag_type VARCHAR(32) NOT NULL DEFAULT 'SATISFACTION' COMMENT 'SATISFACTION/IMPROVEMENT',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  PRIMARY KEY (id),
  KEY idx_qy_review_tag_review (review_id),
  CONSTRAINT fk_qy_review_tag_review FOREIGN KEY (review_id) REFERENCES qy_service_review (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Review tag';

CREATE TABLE qy_review_image (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'Primary key',
  review_id BIGINT UNSIGNED NOT NULL COMMENT 'Review id',
  image_url VARCHAR(512) NOT NULL COMMENT 'Image URL',
  sort_order INT NOT NULL DEFAULT 0 COMMENT 'Sort order',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Created time',
  PRIMARY KEY (id),
  KEY idx_qy_review_image_review (review_id, sort_order),
  CONSTRAINT fk_qy_review_image_review FOREIGN KEY (review_id) REFERENCES qy_service_review (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Review image';

INSERT INTO qy_dict_type (type_code, type_name, description, sort_order) VALUES
('booking_status', '预约状态', '预约和服务订单统一状态', 10),
('payment_status', '支付状态', '支付与退款状态', 20),
('therapist_status', '技师状态', '技师可约和服务状态', 30),
('room_status', '房间状态', '房间占用状态', 40),
('time_slot_status', '时间槽状态', '客户端可约时间槽状态', 50),
('business_status', '营业状态', '门店营业状态', 60),
('coupon_status', '优惠券状态', '优惠券活动和客户券状态', 70),
('member_scope', '权益范围', '统一品牌权益范围', 80),
('admin_user_status', '后台用户状态', '后台登录用户状态', 90),
('schedule_status', '排班状态', '技师排班状态', 100),
('checkin_status', '签到状态', '到店签到状态', 110),
('resource_occupation_status', '资源占用状态', '技师和房间占用状态', 120),
('service_item_status', '服务项目状态', '服务项目上下架状态', 130),
('member_account_status', '会员账户状态', '会员账户和套餐状态', 140),
('review_status', '评价状态', '客户服务评价状态', 150),
('refund_status', '退款状态', '支付退款预留状态', 160),
('report_job_status', '报表任务状态', '运营报表生成任务状态', 170);

INSERT INTO qy_dict_item (type_code, item_code, item_label, item_value, sort_order) VALUES
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
('admin_user_status', 'ENABLED', '启用', 'ENABLED', 10),
('admin_user_status', 'DISABLED', '禁用', 'DISABLED', 20),
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
